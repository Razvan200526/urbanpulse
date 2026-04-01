import type { notification } from "@server/db/schema";
import { seedIds } from "@server/seed/constants";

type NotificationInsert = typeof notification.$inferInsert;

export const notificationSeeds: NotificationInsert[] = [
	{
		userId: seedIds.users.maria,
		type: "PULSE_RESPONSE",
		payload: {
			pulseId: seedIds.pulses.lostDog,
			message: "Alex and Irina responded to your pulse.",
		},
		read: false,
		createdAt: new Date("2026-03-31T08:37:00.000Z"),
	},
	{
		userId: seedIds.users.alex,
		type: "PULSE_CONFIRMED",
		payload: {
			pulseId: seedIds.pulses.lostDog,
			message: "Your confirmation was recorded.",
		},
		read: true,
		createdAt: new Date("2026-03-31T08:40:00.000Z"),
	},
	{
		userId: seedIds.users.vlad,
		type: "MESSAGE",
		payload: {
			conversationId: seedIds.conversations.direct,
			message: "Alex sent you a new message.",
		},
		read: false,
		createdAt: new Date("2026-03-31T10:13:00.000Z"),
	},
	{
		userId: seedIds.users.daniel,
		type: "TRANSACTION",
		payload: {
			resourceId: seedIds.resources.portableGenerator,
			message: "Your generator loan request was accepted.",
		},
		read: false,
		createdAt: new Date("2026-03-31T09:45:00.000Z"),
	},
];
