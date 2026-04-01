import type { skill } from "@server/db/schema";
import { seedIds } from "@server/seed/constants";

type SkillInsert = typeof skill.$inferInsert;

export const skillSeeds: SkillInsert[] = [
	{ userId: seedIds.users.alex, tag: "coordination" },
	{ userId: seedIds.users.alex, tag: "logistics" },
	{ userId: seedIds.users.maria, tag: "pet-care" },
	{ userId: seedIds.users.maria, tag: "first-aid" },
	{ userId: seedIds.users.vlad, tag: "paramedic" },
	{ userId: seedIds.users.vlad, tag: "transport" },
	{ userId: seedIds.users.elena, tag: "community-support" },
	{ userId: seedIds.users.elena, tag: "childcare" },
	{ userId: seedIds.users.irina, tag: "communications" },
	{ userId: seedIds.users.irina, tag: "mapping" },
	{ userId: seedIds.users.daniel, tag: "electrical" },
	{ userId: seedIds.users.daniel, tag: "generator-repair" },
];
