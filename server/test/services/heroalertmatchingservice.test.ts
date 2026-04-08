import { beforeEach, describe, expect, test } from "bun:test";
import { heroAlertMatchingService } from "@server/services/HeroAlertMatchingService";
import { PulseEnum, UrgencyEnum } from "@shared/types";
import {
	createPulse,
	createQuietHours,
	createSkill,
	createUser,
} from "../helpers/fixtures";
import { resetDatabase } from "../helpers/testDatabase";

describe("HeroAlertMatchingService", () => {
	beforeEach(resetDatabase);

	test("matches nearby helpers with overlapping skills", async () => {
		const owner = await createUser({
			homeLocation: { x: 26.1, y: 44.43 } as any,
		});
		const helper = await createUser({
			homeLocation: { x: 26.101, y: 44.431 } as any,
			heroAlertRadiusMeters: 800,
		});
		await createSkill({ userId: helper.id, tag: "lifting" });

		const pulse = await createPulse({
			userId: owner.id,
			type: PulseEnum.Skill,
			urgency: UrgencyEnum.NotUrgent,
			position: { x: 26.1, y: 44.43 } as any,
			requestedSkillTags: ["lifting"],
		});

		const matches = await heroAlertMatchingService.matchPulse(pulse);

		expect(matches).toHaveLength(1);
		expect(matches[0]?.user.id).toBe(helper.id);
		expect(matches[0]?.matchedTags).toEqual(["lifting"]);
		expect(matches[0]?.usedLiveLocation).toBe(false);
	});

	test("prefers fresh live location over the saved fallback", async () => {
		const owner = await createUser();
		const helper = await createUser({
			homeLocation: { x: 27.0, y: 45.0 } as any,
			lastKnownLocation: { x: 26.101, y: 44.431 } as any,
			lastKnownLocationUpdatedAt: new Date(),
			heroAlertRadiusMeters: 600,
		});
		await createSkill({ userId: helper.id, tag: "transport" });

		const pulse = await createPulse({
			userId: owner.id,
			position: { x: 26.1, y: 44.43 } as any,
			requestedSkillTags: ["transport"],
			type: PulseEnum.Skill,
			urgency: UrgencyEnum.NotUrgent,
		});

		const matches = await heroAlertMatchingService.matchPulse(pulse);

		expect(matches).toHaveLength(1);
		expect(matches[0]?.usedLiveLocation).toBe(true);
	});

	test("respects personal radius limits", async () => {
		const owner = await createUser();
		const helper = await createUser({
			homeLocation: { x: 26.104, y: 44.434 } as any,
			heroAlertRadiusMeters: 100,
		});
		await createSkill({ userId: helper.id, tag: "coordination" });

		const pulse = await createPulse({
			userId: owner.id,
			position: { x: 26.1, y: 44.43 } as any,
			requestedSkillTags: ["coordination"],
			type: PulseEnum.Skill,
			urgency: UrgencyEnum.NotUrgent,
		});

		const matches = await heroAlertMatchingService.matchPulse(pulse);

		expect(matches).toHaveLength(0);
	});

	test("suppresses quiet hours for non-urgent requests but bypasses them for urgent emergencies", async () => {
		const owner = await createUser();
		const helper = await createUser({
			homeLocation: { x: 26.101, y: 44.431 } as any,
			heroAlertRadiusMeters: 1000,
		});
		await createSkill({ userId: helper.id, tag: "first-aid" });
		await createQuietHours({
			userId: helper.id,
			startTime: "00:00:00",
			endTime: "23:59:00",
			days: "Sun,Mon,Tue,Wed,Thu,Fri,Sat",
		});

		const nonUrgentPulse = await createPulse({
			userId: owner.id,
			position: { x: 26.1, y: 44.43 } as any,
			requestedSkillTags: ["first-aid"],
			type: PulseEnum.Skill,
			urgency: UrgencyEnum.NotUrgent,
		});
		const urgentEmergencyPulse = await createPulse({
			userId: owner.id,
			position: { x: 26.1, y: 44.43 } as any,
			requestedSkillTags: ["first-aid"],
			type: PulseEnum.Emergency,
			urgency: UrgencyEnum.Urgent,
		});

		expect(
			await heroAlertMatchingService.matchPulse(nonUrgentPulse),
		).toHaveLength(0);
		expect(
			await heroAlertMatchingService.matchPulse(urgentEmergencyPulse),
		).toHaveLength(1);
	});
});
