import type { petMatch } from "@server/db/schema";
import { seedIds } from "@server/seed/constants";

type PetMatchInsert = typeof petMatch.$inferInsert;

export const petMatchSeeds: PetMatchInsert[] = [
	{
		lostAlertId: seedIds.petAlerts.lostDog,
		foundAlertId: seedIds.petAlerts.foundDog,
		confidenceScore: 0.93,
		imageSimilarity: 0.96,
		matchedAttributes: ["species", "color"],
		createdAt: new Date("2026-03-31T08:42:00.000Z"),
	},
];
