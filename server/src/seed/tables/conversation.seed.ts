import type { conversation } from "@server/db/schema";
import { seedIds } from "@server/seed/constants";
import { ConversationTypeEnum } from "@shared/types";

type ConversationInsert = typeof conversation.$inferInsert;

export const conversationSeeds: ConversationInsert[] = [
	{
		id: seedIds.conversations.lostDog,
		type: ConversationTypeEnum.Pulse,
		pulseId: seedIds.pulses.lostDog,
		createdAt: new Date("2026-03-31T08:30:00.000Z"),
	},
	{
		id: seedIds.conversations.direct,
		type: ConversationTypeEnum.Direct,
		pulseId: null,
		createdAt: new Date("2026-03-31T10:10:00.000Z"),
	},
	{
		id: seedIds.conversations.helpers,
		type: ConversationTypeEnum.Group,
		pulseId: seedIds.pulses.powerOutage,
		createdAt: new Date("2026-03-31T08:45:00.000Z"),
	},
];
