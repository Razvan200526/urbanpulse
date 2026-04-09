import type { QuietHoursType, SkillType, UserType } from "@server/db/schema";
import {
	type QuietHoursRepository,
	quietHoursRepository,
} from "@server/repositories/QuietHoursRepository";
import {
	type SkillRepository,
	skillRepository,
} from "@server/repositories/SkillRepository";
import type { UserConditionOptions } from "@server/repositories/types";
import {
	type UserRepository,
	userRepository,
} from "@server/repositories/UserRepository";
import { cacheManager } from "@server/services/cache/CacheManager";
import type { Last7DaysUserCounts } from "@server/services/types";
import { logger } from "@server/utils/Logger";
import { isEmailValid } from "@shared/validators/isEmailValid";
import type { SignUpInfoType } from "@shared/validators/isSignUpInfoValid";
import type {
	AlertPreferencesUpdateType,
	QuietHoursUpsertType,
	SkillTagsUpdateType,
	UserProfileUpdateType,
} from "@shared/validators/users/isUserProfileValid";
import type { User } from "better-auth";
import auth from "./auth/AuthService";

type UserProfileView = {
	user: UserType;
	quietHours: {
		id: string;
		startTime: string;
		endTime: string;
		days: string[];
	} | null;
	skillTags: string[];
	alertPreferences: {
		homeLocation: { x: number; y: number } | null;
		lastKnownLocation: { x: number; y: number } | null;
		lastKnownLocationUpdatedAt: string | null;
		heroAlertRadiusMeters: number;
	};
};

export class UserService {
	private readonly userRepo: UserRepository;
	private readonly quietHoursRepo: QuietHoursRepository;
	private readonly skillRepo: SkillRepository;
	private cache = cacheManager;
	constructor() {
		this.userRepo = userRepository;
		this.quietHoursRepo = quietHoursRepository;
		this.skillRepo = skillRepository;
	}

	/**
	 * Normalizes the provided date to UTC day start.
	 * @param {Date} date - Source date.
	 * @returns {Date} UTC day start.
	 */
	private startOfUtcDay(date: Date): Date {
		return new Date(
			Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
		);
	}

	/**
	 * Adds a number of days to a date.
	 * @param {Date} date - Base date.
	 * @param {number} days - Number of days to add.
	 * @returns {Date} Shifted date.
	 */
	private addDays(date: Date, days: number): Date {
		const DAY_MS = 24 * 60 * 60 * 1000;
		return new Date(date.getTime() + days * DAY_MS);
	}

	private toShortTime(value: string) {
		return value.slice(0, 5);
	}

	private toDatabaseTime(value: string) {
		return value.length === 5 ? `${value}:00` : value;
	}

	private formatQuietHours(quietHours: QuietHoursType | null) {
		if (!quietHours) {
			return null;
		}

		return {
			id: quietHours.id,
			startTime: this.toShortTime(quietHours.startTime),
			endTime: this.toShortTime(quietHours.endTime),
			days: quietHours.days
				.split(",")
				.map((day) => day.trim())
				.filter(Boolean),
		};
	}

	private formatAlertPreferences(user: UserType) {
		return {
			homeLocation: user.homeLocation ?? null,
			lastKnownLocation: user.lastKnownLocation ?? null,
			lastKnownLocationUpdatedAt:
				user.lastKnownLocationUpdatedAt?.toISOString() ?? null,
			heroAlertRadiusMeters: user.heroAlertRadiusMeters ?? 500,
		};
	}

	async getProfile(userId: string): Promise<UserProfileView | null> {
		return await this.cache.getOrSet(
			`${userId}:profile`,
			async () => {
				const user = await this.userRepo.getOne(userId);
				if (!user) {
					return null;
				}

				const [quietHours, skills] = await Promise.all([
					this.quietHoursRepo.findByUserId(userId),
					this.skillRepo.getByUserId(userId),
				]);

				return {
					user,
					quietHours: this.formatQuietHours(quietHours),
					skillTags: skills.map((entry: SkillType) => entry.tag),
					alertPreferences: this.formatAlertPreferences(user),
				};
			},
			{ namespace: "profile", ttl: 1800 },
		);
	}

	/**
	 * Retrieves users filtered by column options and optional createdAt condition.
	 * @param {Partial<UserType>} options - Partial user filters.
	 * @param {UserConditionOptions} [condition] - Optional createdAt range.
	 * @returns {Promise<UserType[] | null>} Matching users or null on failure.
	 */
	async getUsersByCondition(
		options: Partial<UserType>,
		condition?: UserConditionOptions,
	): Promise<UserType[] | null> {
		try {
			return await this.userRepo.getByOptions(options, condition);
		} catch (error) {
			logger.exception(error as Error);
			return null;
		}
	}

	/**
	 * Counts users filtered by column options and optional createdAt condition.
	 * @param {Partial<UserType>} options - Partial user filters.
	 * @param {UserConditionOptions} [condition] - Optional createdAt range.
	 * @returns {Promise<number>} Number of matching users.
	 */
	async countUsersByCondition(
		options: Partial<UserType>,
		condition?: UserConditionOptions,
	): Promise<number> {
		const users = await this.getUsersByCondition(options, condition);
		return users?.length ?? 0;
	}

	/**
	 * Calculates new-user counts for current and previous 7-day windows.
	 * @param {Partial<UserType>} options - Partial user filters.
	 * @param {Date} [referenceDate] - Date used to anchor the rolling windows.
	 * @returns {Promise<Last7DaysUserCounts | null>} Current and previous window counts.
	 */
	async getUserCountsForLast7Days(
		options: Partial<UserType>,
		referenceDate: Date = new Date(),
	): Promise<Last7DaysUserCounts | null> {
		try {
			const windowDays = 7;
			const todayStart = this.startOfUtcDay(referenceDate);
			const currentWindowStart = this.addDays(todayStart, -(windowDays - 1));
			const currentWindowEnd = this.addDays(todayStart, 1);
			const previousWindowStart = this.addDays(currentWindowStart, -windowDays);
			const previousWindowEnd = currentWindowStart;

			const [newUsersLast7Days, previousNewUsersLast7Days] = await Promise.all([
				this.countUsersByCondition(options, {
					createdAtFrom: currentWindowStart,
					createdAtTo: currentWindowEnd,
				}),
				this.countUsersByCondition(options, {
					createdAtFrom: previousWindowStart,
					createdAtTo: previousWindowEnd,
				}),
			]);

			return {
				newUsersLast7Days,
				previousNewUsersLast7Days,
				currentWindowStart,
				currentWindowEnd,
				previousWindowStart,
				previousWindowEnd,
			};
		} catch (error) {
			logger.exception(error as Error);
			return null;
		}
	}

	async verifyUserExists(email: string): Promise<boolean> {
		const isValid = isEmailValid(email);
		if (!isValid) {
			return true;
		}
		const user = (await this.userRepo.findByEmail(email)) as User;
		if (!user) {
			logger.success(`User doesn't exist: ${email}`);
			return false;
		} else {
			return true;
		}
	}

	async signUp(payload: SignUpInfoType) {
		const { email, password, name, bio, image } = payload;

		const newUser = await auth.api.signUpEmail({
			body: {
				email,
				password,
				name,
				bio,
				image,
			},
		});

		return newUser;
	}

	async updateProfile(userId: string, payload: UserProfileUpdateType) {
		try {
			return await this.userRepo.update(userId, {
				name: payload.name,
				bio: payload.bio,
				image: payload.image || null,
				updatedAt: new Date(),
			});
		} catch (error) {
			logger.exception(error as Error);
			return null;
		}
	}

	async updateSkillTags(userId: string, payload: SkillTagsUpdateType) {
		const tags = Array.from(
			new Set(payload.tags.map((tag) => tag.trim()).filter(Boolean)),
		);

		try {
			await this.skillRepo.deleteByUserId(userId);

			if (tags.length === 0) {
				return [];
			}

			await Promise.all(
				tags.map((tag) =>
					this.skillRepo.create({
						tag,
						userId,
					}),
				),
			);

			return tags;
		} catch (error) {
			logger.exception(error as Error);
			return null;
		}
	}

	async upsertQuietHours(userId: string, payload: QuietHoursUpsertType) {
		try {
			const existing = await this.quietHoursRepo.findByUserId(userId);
			const data = {
				userId,
				startTime: this.toDatabaseTime(payload.startTime),
				endTime: this.toDatabaseTime(payload.endTime),
				days: payload.days.join(","),
			};

			const quietHours = existing
				? await this.quietHoursRepo.update(existing.id, data)
				: await this.quietHoursRepo.create(data);

			return this.formatQuietHours(quietHours);
		} catch (error) {
			logger.exception(error as Error);
			return null;
		}
	}

	async updateAlertPreferences(
		userId: string,
		payload: AlertPreferencesUpdateType,
	) {
		try {
			const updated = await this.userRepo.update(userId, {
				homeLocation: payload.homeLocation,
				heroAlertRadiusMeters: payload.heroAlertRadiusMeters,
				updatedAt: new Date(),
			});
			return this.formatAlertPreferences(updated);
		} catch (error) {
			logger.exception(error as Error);
			return null;
		}
	}

	async updateLastKnownLocation(
		userId: string,
		location: { x: number; y: number },
	) {
		try {
			return await this.userRepo.update(userId, {
				lastKnownLocation: location,
				lastKnownLocationUpdatedAt: new Date(),
				updatedAt: new Date(),
			});
		} catch (error) {
			logger.exception(error as Error);
			return null;
		}
	}

	async deleteAccount(userId: string) {
		try {
			return await this.userRepo.delete(userId);
		} catch (error) {
			logger.exception(error as Error);
			return false;
		}
	}
}

export const userService = new UserService();
