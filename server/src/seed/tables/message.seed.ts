import type { message } from "@server/db/schema";
import { seedIds } from "@server/seed/constants";

type MessageInsert = typeof message.$inferInsert;

export const messageSeeds: MessageInsert[] = [
	{
		conversationId: seedIds.conversations.lostDog,
		senderId: seedIds.users.maria,
		content:
			"Luna slipped her leash near the park fountain about 20 minutes ago.",
		sentAt: new Date("2026-03-31T08:31:00.000Z"),
	},
	{
		conversationId: seedIds.conversations.lostDog,
		senderId: seedIds.users.alex,
		content:
			"I can check the nearby alleys and post an alert in the neighborhood group.",
		sentAt: new Date("2026-03-31T08:34:00.000Z"),
	},
	{
		conversationId: seedIds.conversations.lostDog,
		senderId: seedIds.users.irina,
		content: "I saw a similar dog heading toward Izvor station, checking now.",
		sentAt: new Date("2026-03-31T08:36:00.000Z"),
	},
	{
		conversationId: seedIds.conversations.direct,
		senderId: seedIds.users.vlad,
		content: "I can cover clinic transport after 14:30 if needed.",
		sentAt: new Date("2026-03-31T10:12:00.000Z"),
	},
	{
		conversationId: seedIds.conversations.direct,
		senderId: seedIds.users.alex,
		content: "Perfect. I will confirm with Elena and send exact address.",
		sentAt: new Date("2026-03-31T10:13:00.000Z"),
	},
	{
		conversationId: seedIds.conversations.helpers,
		senderId: seedIds.users.daniel,
		content: "Power should be back tomorrow morning. We need one backup unit.",
		sentAt: new Date("2026-03-31T08:47:00.000Z"),
	},
	{
		conversationId: seedIds.conversations.helpers,
		senderId: seedIds.users.elena,
		content: "I can loan extension cables and a surge protector.",
		sentAt: new Date("2026-03-31T08:50:00.000Z"),
	},
];
