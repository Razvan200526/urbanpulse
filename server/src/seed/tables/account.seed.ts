import type { account } from "@server/db/schema";
import { seedIds } from "@server/seed/constants";

type AccountInsert = typeof account.$inferInsert;

const providerId = "credentials";
const passwordHash =
	"$2b$10$wS2VYVYb7wI1hA8d2CzqPOYhYkCb7o4mRjHYFaMh.BfJiM5xQm2Na";

export const accountSeeds: AccountInsert[] = [
	{
		id: "acc_alex",
		accountId: "alex-credentials",
		providerId,
		userId: seedIds.users.alex,
		password: passwordHash,
		createdAt: new Date("2026-03-21T08:00:00.000Z"),
		updatedAt: new Date("2026-03-31T10:00:00.000Z"),
	},
	{
		id: "acc_maria",
		accountId: "maria-credentials",
		providerId,
		userId: seedIds.users.maria,
		password: passwordHash,
		createdAt: new Date("2026-03-20T11:15:00.000Z"),
		updatedAt: new Date("2026-03-30T18:20:00.000Z"),
	},
	{
		id: "acc_vlad",
		accountId: "vlad-credentials",
		providerId,
		userId: seedIds.users.vlad,
		password: passwordHash,
		createdAt: new Date("2026-03-22T09:30:00.000Z"),
		updatedAt: new Date("2026-03-30T13:10:00.000Z"),
	},
	{
		id: "acc_elena",
		accountId: "elena-credentials",
		providerId,
		userId: seedIds.users.elena,
		password: passwordHash,
		createdAt: new Date("2026-03-23T07:40:00.000Z"),
		updatedAt: new Date("2026-03-29T12:45:00.000Z"),
	},
	{
		id: "acc_irina",
		accountId: "irina-credentials",
		providerId,
		userId: seedIds.users.irina,
		password: passwordHash,
		createdAt: new Date("2026-03-24T10:00:00.000Z"),
		updatedAt: new Date("2026-03-30T08:55:00.000Z"),
	},
	{
		id: "acc_daniel",
		accountId: "daniel-credentials",
		providerId,
		userId: seedIds.users.daniel,
		password: passwordHash,
		createdAt: new Date("2026-03-25T12:10:00.000Z"),
		updatedAt: new Date("2026-03-30T16:00:00.000Z"),
	},
];
