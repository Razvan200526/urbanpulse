import { beforeEach, describe, expect, test } from "bun:test";
import { messagingService } from "@server/services/MessagingService";
import { createPulse, createUser } from "../helpers/fixtures";
import { resetDatabase } from "../helpers/testDatabase";

describe("MessagingService", () => {
	beforeEach(resetDatabase);

	test("reuses direct conversations for the same pair of users", async () => {
		const firstUser = await createUser();
		const secondUser = await createUser();

		const firstConversation = await messagingService.ensureDirectConversation(
			firstUser.id,
			secondUser.id,
		);
		const secondConversation = await messagingService.ensureDirectConversation(
			firstUser.id,
			secondUser.id,
		);

		expect(firstConversation?.id).toBe(secondConversation?.id);

		const conversations = await messagingService.listConversationsForUser(
			firstUser.id,
		);
		expect(conversations).toHaveLength(1);
	});

	test("creates pulse conversations, adds accepted members, and restricts message sending to members", async () => {
		const owner = await createUser();
		const responder = await createUser();
		const outsider = await createUser();
		const pulse = await createPulse({ userId: owner.id });

		const conversation = await messagingService.ensurePulseConversation(
			pulse.id,
			[owner.id, responder.id],
		);

		expect(conversation).not.toBeNull();

		const sent = await messagingService.sendMessage({
			conversationId: conversation!.id,
			senderId: owner.id,
			content: "Meet me near the building entrance.",
		});
		expect(sent?.message.content).toBe("Meet me near the building entrance.");

		const responderThread = await messagingService.getConversationThread(
			responder.id,
			conversation!.id,
		);
		expect(responderThread?.messages).toHaveLength(1);

		const outsiderAttempt = await messagingService.sendMessage({
			conversationId: conversation!.id,
			senderId: outsider.id,
			content: "I should not be able to send this.",
		});
		expect(outsiderAttempt).toBeNull();
	});
});
