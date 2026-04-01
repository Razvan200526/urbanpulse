import type { conversationMember } from "@server/db/schema";
import { seedIds } from "@server/seed/constants";

type ConversationMemberInsert = typeof conversationMember.$inferInsert;

export const conversationMemberSeeds: ConversationMemberInsert[] = [
	{
		conversationId: seedIds.conversations.lostDog,
		userId: seedIds.users.maria,
	},
	{
		conversationId: seedIds.conversations.lostDog,
		userId: seedIds.users.alex,
	},
	{
		conversationId: seedIds.conversations.lostDog,
		userId: seedIds.users.irina,
	},
	{
		conversationId: seedIds.conversations.direct,
		userId: seedIds.users.alex,
	},
	{
		conversationId: seedIds.conversations.direct,
		userId: seedIds.users.vlad,
	},
	{
		conversationId: seedIds.conversations.helpers,
		userId: seedIds.users.daniel,
	},
	{
		conversationId: seedIds.conversations.helpers,
		userId: seedIds.users.elena,
	},
	{
		conversationId: seedIds.conversations.helpers,
		userId: seedIds.users.vlad,
	},
];
