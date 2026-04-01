import type { session } from "@server/db/schema";
import { seedIds } from "@server/seed/constants";

type SessionInsert = typeof session.$inferInsert;

export const sessionSeeds: SessionInsert[] = [
	{
		id: "sess_alex_01",
		expiresAt: new Date("2026-12-01T08:00:00.000Z"),
		token: "token_alex_active",
		createdAt: new Date("2026-03-31T10:00:00.000Z"),
		updatedAt: new Date("2026-03-31T10:00:00.000Z"),
		ipAddress: "127.0.0.1",
		userAgent: "UrbanPulse Web",
		userId: seedIds.users.alex,
	},
	{
		id: "sess_maria_01",
		expiresAt: new Date("2026-11-20T11:00:00.000Z"),
		token: "token_maria_active",
		createdAt: new Date("2026-03-30T12:00:00.000Z"),
		updatedAt: new Date("2026-03-30T12:00:00.000Z"),
		ipAddress: "127.0.0.1",
		userAgent: "UrbanPulse Mobile",
		userId: seedIds.users.maria,
	},
	{
		id: "sess_vlad_01",
		expiresAt: new Date("2026-11-25T09:00:00.000Z"),
		token: "token_vlad_active",
		createdAt: new Date("2026-03-30T09:00:00.000Z"),
		updatedAt: new Date("2026-03-30T09:00:00.000Z"),
		ipAddress: "127.0.0.1",
		userAgent: "UrbanPulse Web",
		userId: seedIds.users.vlad,
	},
];
