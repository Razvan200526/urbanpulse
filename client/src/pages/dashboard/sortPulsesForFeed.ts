import type { PulseType } from "@server/db/schema";
import { PulseEnum, UrgencyEnum } from "@shared/types";

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

/** Higher-priority community needs first, then newest. */
export function sortPulsesForFeed(pulses: PulseType[]): PulseType[] {
	return [...pulses].sort((a, b) => {
		const ua = urgencyOrder[a.urgency] ?? 9;
		const ub = urgencyOrder[b.urgency] ?? 9;
		if (ua !== ub) return ua - ub;
		const ta = typeOrder[a.type] ?? 9;
		const tb = typeOrder[b.type] ?? 9;
		if (ta !== tb) return ta - tb;
		return (
			new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
		);
	});
}
