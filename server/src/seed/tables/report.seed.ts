import type { report } from "@server/db/schema";
import { seedIds } from "@server/seed/constants";
import { ReportStatusEnum } from "@shared/types";

type ReportInsert = typeof report.$inferInsert;

export const reportSeeds: ReportInsert[] = [
	{
		reporterId: seedIds.users.irina,
		targetUserId: seedIds.users.daniel,
		targetPulseId: null,
		reason: "No-show on confirmed generator handoff window.",
		status: ReportStatusEnum.Pending,
		createdAt: new Date("2026-03-31T11:05:00.000Z"),
	},
	{
		reporterId: seedIds.users.alex,
		targetUserId: null,
		targetPulseId: seedIds.pulses.medicalRide,
		reason: "Pulse left active after task was completed.",
		status: ReportStatusEnum.Resolved,
		createdAt: new Date("2026-03-31T09:55:00.000Z"),
	},
];
