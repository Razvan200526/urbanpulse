import { beforeEach, describe, expect, test } from "bun:test";
import { messagingService } from "@server/services/MessagingService";
import { ConversationTypeEnum } from "@shared/types";
import {
	createConversation,
	createConversationMember,
	createPulse,
	createUser,
} from "../helpers/fixtures";
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

	test("reuses a legacy two-member pulse conversation for coordination and converts it to direct", async () => {
		const owner = await createUser();
		const responder = await createUser();
		const pulse = await createPulse({ userId: owner.id });
		const legacyConversation = await createConversation({
			type: ConversationTypeEnum.Pulse,
			pulseId: pulse.id,
		});

		await createConversationMember({
			conversationId: legacyConversation.id,
			userId: owner.id,
		});
		await createConversationMember({
			conversationId: legacyConversation.id,
			userId: responder.id,
		});

		const coordinationConversation =
			await messagingService.ensureCoordinationConversation(
				owner.id,
				responder.id,
			);

		expect(coordinationConversation?.id).toBe(legacyConversation.id);
		expect(coordinationConversation?.type).toBe(ConversationTypeEnum.Direct);
		expect(coordinationConversation?.pulseId).toBeNull();
	});

	test("reuses the oldest eligible legacy pulse conversation for a pair", async () => {
		const owner = await createUser();
		const responder = await createUser();
		const firstPulse = await createPulse({ userId: owner.id });
		const secondPulse = await createPulse({ userId: owner.id });
		const firstConversation = await createConversation({
			type: ConversationTypeEnum.Pulse,
			pulseId: firstPulse.id,
		});

		await createConversationMember({
			conversationId: firstConversation.id,
			userId: owner.id,
		});
		await createConversationMember({
			conversationId: firstConversation.id,
			userId: responder.id,
		});

		const secondConversation = await createConversation({
			type: ConversationTypeEnum.Pulse,
			pulseId: secondPulse.id,
		});
		await createConversationMember({
			conversationId: secondConversation.id,
			userId: owner.id,
		});
		await createConversationMember({
			conversationId: secondConversation.id,
			userId: responder.id,
		});

		const coordinationConversation =
			await messagingService.ensureCoordinationConversation(
				owner.id,
				responder.id,
			);

		expect(coordinationConversation?.id).toBe(firstConversation.id);
		expect(coordinationConversation?.type).toBe(ConversationTypeEnum.Direct);
		expect(coordinationConversation?.pulseId).toBeNull();
	});

	test("does not reuse group or multi-member pulse conversations as pair coordination threads", async () => {
		const owner = await createUser();
		const responder = await createUser();
		const thirdMember = await createUser();
		const pulse = await createPulse({ userId: owner.id });
		const groupConversation = await createConversation({
			type: ConversationTypeEnum.Pulse,
			pulseId: pulse.id,
		});

		await createConversationMember({
			conversationId: groupConversation.id,
			userId: owner.id,
		});
		await createConversationMember({
			conversationId: groupConversation.id,
			userId: responder.id,
		});
		await createConversationMember({
			conversationId: groupConversation.id,
			userId: thirdMember.id,
		});

		const coordinationConversation =
			await messagingService.ensureCoordinationConversation(
				owner.id,
				responder.id,
			);

		expect(coordinationConversation).not.toBeNull();
		expect(coordinationConversation?.id).not.toBe(groupConversation.id);
		expect(coordinationConversation?.type).toBe(ConversationTypeEnum.Direct);
	});
});
