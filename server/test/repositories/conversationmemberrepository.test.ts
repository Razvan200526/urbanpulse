import { beforeEach, describe, expect, test } from "bun:test";
import { conversationMemberRepository } from "@server/repositories/ConversationMemberRepository";
import {
	createConversation,
	createConversationMember,
	createUser,
} from "../helpers/fixtures";
import { resetDatabase } from "../helpers/testDatabase";

describe("ConversationMemberRepository", () => {
	beforeEach(resetDatabase);

	test("supports CRUD operations", async () => {
		const conversation = await createConversation();
		const user = await createUser();

		expect(
			await conversationMemberRepository.getOne(
				"00000000-0000-0000-0000-000000000000",
			),
		).toBeNull();

		const created = await conversationMemberRepository.create({
			conversationId: conversation.id,
			userId: user.id,
		});

		expect(created).not.toBeNull();
		expect(
			(await conversationMemberRepository.getOne(created!.id))?.userId,
		).toBe(user.id);
		expect(await conversationMemberRepository.getAll()).toHaveLength(1);

		const replacementUser = await createUser();
		const updated = await conversationMemberRepository.update(created!.id, {
			userId: replacementUser.id,
		});
		expect(updated.userId).toBe(replacementUser.id);
		await expect(
			conversationMemberRepository.update(
				"00000000-0000-0000-0000-000000000000",
				{
					userId: replacementUser.id,
				},
			),
		).rejects.toThrow(
			"ConversationMemberRepository: Record with id 00000000-0000-0000-0000-000000000000 not found",
		);

		expect(await conversationMemberRepository.delete(created!.id)).toBe(true);
		expect(await conversationMemberRepository.delete(created!.id)).toBe(false);
	});

	test("returns all members", async () => {
		await createConversationMember();
		await createConversationMember();

		expect(await conversationMemberRepository.getAll()).toHaveLength(2);
	});
});
