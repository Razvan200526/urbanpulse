import type { pulseConfirmation } from "@server/db/schema";
import { seedIds } from "@server/seed/constants";

type PulseConfirmationInsert = typeof pulseConfirmation.$inferInsert;

export const pulseConfirmationSeeds: PulseConfirmationInsert[] = [
	{
		pulseId: seedIds.pulses.lostDog,
		userId: seedIds.users.alex,
		confirmedAt: new Date("2026-03-31T08:39:00.000Z"),
	},
	{
		pulseId: seedIds.pulses.lostDog,
		userId: seedIds.users.irina,
		confirmedAt: new Date("2026-03-31T08:41:00.000Z"),
	},
	{
		pulseId: seedIds.pulses.bloodDrive,
		userId: seedIds.users.vlad,
		confirmedAt: new Date("2026-03-31T09:12:00.000Z"),
	},
];
