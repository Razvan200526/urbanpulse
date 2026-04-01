import type { verification } from "@server/db/schema";

type VerificationInsert = typeof verification.$inferInsert;

export const verificationSeeds: VerificationInsert[] = [
	{
		id: "verify_alex_email",
		identifier: "alex@urbanpulse.local",
		value: "OTP-927114",
		expiresAt: new Date("2026-04-01T10:30:00.000Z"),
		createdAt: new Date("2026-04-01T10:00:00.000Z"),
		updatedAt: new Date("2026-04-01T10:00:00.000Z"),
	},
	{
		id: "verify_irina_email",
		identifier: "irina@urbanpulse.local",
		value: "OTP-150382",
		expiresAt: new Date("2026-04-01T12:30:00.000Z"),
		createdAt: new Date("2026-04-01T12:00:00.000Z"),
		updatedAt: new Date("2026-04-01T12:00:00.000Z"),
	},
];
