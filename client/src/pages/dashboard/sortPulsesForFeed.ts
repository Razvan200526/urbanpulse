import type { PulseType } from "@server/db/schema";
import { PulseEnum, UrgencyEnum } from "@shared/types";

type FeedPulse = Pick<
	PulseType,
	"urgency" | "type" | "createdAt" | "isVerified"
> & {
	authorRole?: string | null;
	authorTrustScore?: number | null;
	authorIsVerified?: boolean | null;
};

const urgencyOrder: Record<string, number> = {
	[UrgencyEnum.Immediate]: 0,
	[UrgencyEnum.Urgent]: 1,
	[UrgencyEnum.NotUrgent]: 2,
	[UrgencyEnum.Unknown]: 3,
};

const typeOrder: Record<string, number> = {
	[PulseEnum.Emergency]: 0,
	[PulseEnum.Skill]: 1,
	[PulseEnum.Item]: 2,
};

const elevatedCrisisRoles = new Set([
	"admin",
	"emergency-service",
	"emergency_service",
	"responder",
]);

function hasElevatedCrisisRole(role: string | null | undefined) {
	return role ? elevatedCrisisRoles.has(role) : false;
}

function compareDefaultFeedOrder(a: FeedPulse, b: FeedPulse) {
	const ua = urgencyOrder[a.urgency] ?? 9;
	const ub = urgencyOrder[b.urgency] ?? 9;
	if (ua !== ub) return ua - ub;
	const ta = typeOrder[a.type] ?? 9;
	const tb = typeOrder[b.type] ?? 9;
	if (ta !== tb) return ta - tb;
	return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
}

function compareCrisisPriority(a: FeedPulse, b: FeedPulse) {
	const adminDelta =
		Number(hasElevatedCrisisRole(b.authorRole)) -
		Number(hasElevatedCrisisRole(a.authorRole));
	if (adminDelta !== 0) {
		return adminDelta;
	}

	const pulseVerifiedDelta =
		Number(b.isVerified === true) - Number(a.isVerified === true);
	if (pulseVerifiedDelta !== 0) {
		return pulseVerifiedDelta;
	}

	const authorVerifiedDelta =
		Number(b.authorIsVerified === true) - Number(a.authorIsVerified === true);
	if (authorVerifiedDelta !== 0) {
		return authorVerifiedDelta;
	}

	const trustDelta = (b.authorTrustScore ?? 0) - (a.authorTrustScore ?? 0);
	if (trustDelta !== 0) {
		return trustDelta;
	}

	const urgencyDelta =
		(urgencyOrder[a.urgency] ?? 9) - (urgencyOrder[b.urgency] ?? 9);
	if (urgencyDelta !== 0) {
		return urgencyDelta;
	}

	return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
}

export function sortPulsesForFeed<T extends FeedPulse>(pulses: T[]): T[] {
	return [...pulses].sort(compareDefaultFeedOrder);
}

export function sortCrisisEmergencyPulses<T extends FeedPulse>(
	pulses: T[],
): T[] {
	return [...pulses].sort(compareCrisisPriority);
}
