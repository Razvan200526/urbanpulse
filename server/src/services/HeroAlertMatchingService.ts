import type { PulseType, QuietHoursType, UserType } from "@server/db/schema";
import { cacheManager } from "@server/services/cache/CacheManager";
import { quietHoursRepository } from "@server/repositories/QuietHoursRepository";
import { skillRepository } from "@server/repositories/SkillRepository";
import { userRepository } from "@server/repositories/UserRepository";
import { logger } from "@server/utils/Logger";
import { PulseEnum, UrgencyEnum } from "@shared/types";
import { normalizeSkillTag } from "./RequestMatchingAIService";

const LIVE_LOCATION_MAX_AGE_MS = 10 * 60 * 1000;
const MAX_MATCH_RADIUS_METERS = 5000;
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

type MatchCandidate = {
	user: UserType;
	matchedTags: string[];
	distanceMeters: number;
	usedLiveLocation: boolean;
	quietHoursBypassed: boolean;
};

function distanceInMeters(
	a: { x: number; y: number },
	b: { x: number; y: number },
) {
	const R = 6371e3;
	const lat1 = (a.y * Math.PI) / 180;
	const lat2 = (b.y * Math.PI) / 180;
	const dLat = ((b.y - a.y) * Math.PI) / 180;
	const dLon = ((b.x - a.x) * Math.PI) / 180;

	const haversine =
		Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

	return 2 * R * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

function parseTimeToMinutes(value: string) {
	const [hours = "0", minutes = "0"] = value.split(":");
	return Number(hours) * 60 + Number(minutes);
}

function isQuietHoursActive(quietHours: QuietHoursType | null, now: Date) {
	if (!quietHours) {
		return false;
	}

	const activeDays = new Set(
		quietHours.days
			.split(",")
			.map((day) => day.trim())
			.filter(Boolean),
	);
	const currentDay = WEEKDAYS[now.getDay()] ?? "Sun";
	const previousDay = WEEKDAYS[(now.getDay() + 6) % 7] ?? "Sun";
	const currentMinutes = now.getHours() * 60 + now.getMinutes();
	const startMinutes = parseTimeToMinutes(quietHours.startTime);
	const endMinutes = parseTimeToMinutes(quietHours.endTime);

	if (startMinutes === endMinutes) {
		return activeDays.has(currentDay);
	}

	if (startMinutes < endMinutes) {
		return (
			activeDays.has(currentDay) &&
			currentMinutes >= startMinutes &&
			currentMinutes < endMinutes
		);
	}

	return (
		(activeDays.has(currentDay) && currentMinutes >= startMinutes) ||
		(activeDays.has(previousDay) && currentMinutes < endMinutes)
	);
}

function shouldBypassQuietHours(pulse: PulseType) {
	return (
		pulse.type === PulseEnum.Emergency &&
		(pulse.urgency === UrgencyEnum.Immediate ||
			pulse.urgency === UrgencyEnum.Urgent)
	);
}

function resolveEffectiveLocation(user: UserType) {
	if (
		user.lastKnownLocation &&
		user.lastKnownLocationUpdatedAt &&
		Date.now() - user.lastKnownLocationUpdatedAt.getTime() <=
			LIVE_LOCATION_MAX_AGE_MS
	) {
		return {
			location: user.lastKnownLocation,
			usedLiveLocation: true,
		};
	}

	if (user.homeLocation) {
		return {
			location: user.homeLocation,
			usedLiveLocation: false,
		};
	}

	return null;
}

export class HeroAlertMatchingService {
	async matchPulse(pulse: PulseType): Promise<MatchCandidate[]> {
		return await this.cache.getOrSet(
			`${pulse.id}:matches`,
			async () => {
				const normalizedPulseTags = (pulse.requestedSkillTags ?? [])
					.map((tag) => normalizeSkillTag(tag))
					.filter(Boolean);

				if (normalizedPulseTags.length === 0) {
					logger.info(
						`Hero matching skipped for Pulse[${pulse.id}] - no inferred tags`,
					);
					return [];
				}

				const nearbyUsers = await userRepository.getPotentialHelpersNearPosition({
					position: pulse.position,
					maxRadiusMeters: MAX_MATCH_RADIUS_METERS,
					excludeUserId: pulse.userId,
				});

				if (nearbyUsers.length === 0) {
					return [];
				}

				const [allSkills, quietHoursRows] = await Promise.all([
					skillRepository.getByUserIds(nearbyUsers.map((entry) => entry.id)),
					quietHoursRepository.findByUserIds(nearbyUsers.map((entry) => entry.id)),
				]);

				const skillsByUserId = new Map<string, string[]>();
				for (const entry of allSkills) {
					const normalized = normalizeSkillTag(entry.tag);
					const existing = skillsByUserId.get(entry.userId) ?? [];
					skillsByUserId.set(entry.userId, [...existing, normalized]);
				}

				const quietHoursByUserId = new Map<string, QuietHoursType>();
				for (const entry of quietHoursRows) {
					quietHoursByUserId.set(entry.userId, entry);
				}

				const bypassQuietHours = shouldBypassQuietHours(pulse);
				const now = new Date();
				const matches: MatchCandidate[] = [];

				for (const candidate of nearbyUsers) {
					const locationResult = resolveEffectiveLocation(candidate);
					if (!locationResult) {
						continue;
					}

					const candidateTags = new Set(skillsByUserId.get(candidate.id) ?? []);
					const matchedTags = normalizedPulseTags.filter((tag) =>
						candidateTags.has(tag),
					);
					if (matchedTags.length === 0) {
						continue;
					}

					const quietHours = quietHoursByUserId.get(candidate.id) ?? null;
					if (!bypassQuietHours && isQuietHoursActive(quietHours, now)) {
						continue;
					}

					const distanceMeters = distanceInMeters(
						pulse.position,
						locationResult.location,
					);
					if (distanceMeters > (candidate.heroAlertRadiusMeters ?? 500)) {
						continue;
					}

					matches.push({
						user: candidate,
						matchedTags,
						distanceMeters: Math.round(distanceMeters),
						usedLiveLocation: locationResult.usedLiveLocation,
						quietHoursBypassed:
							bypassQuietHours && isQuietHoursActive(quietHours, now),
					});
				}

				logger.info(
					`Hero matching evaluated ${nearbyUsers.length} candidates for Pulse[${pulse.id}] and found ${matches.length} matches`,
				);
				return matches;
			},
			{ namespace: "heroAlert", ttl: 600 },
		);
	}

	private cache = cacheManager;
}

export const heroAlertMatchingService = new HeroAlertMatchingService();
