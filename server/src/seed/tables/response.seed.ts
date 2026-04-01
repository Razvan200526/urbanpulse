import type { pulseResponse } from "@server/db/schema";
import { seedIds } from "@server/seed/constants";
import { ResponseStatusEnum } from "@shared/types";

type ResponseInsert = typeof pulseResponse.$inferInsert;

export const responseSeeds: ResponseInsert[] = [
	{
		pulseId: seedIds.pulses.lostDog,
		responderId: seedIds.users.alex,
		status: ResponseStatusEnum.Accepted,
		createdAt: new Date("2026-03-31T08:38:00.000Z"),
	},
	{
		pulseId: seedIds.pulses.lostDog,
		responderId: seedIds.users.irina,
		status: ResponseStatusEnum.Pending,
		createdAt: new Date("2026-03-31T08:39:00.000Z"),
	},
	{
		pulseId: seedIds.pulses.medicalRide,
		responderId: seedIds.users.vlad,
		status: ResponseStatusEnum.Completed,
		createdAt: new Date("2026-03-30T15:15:00.000Z"),
	},
];
