import { beforeEach, describe, expect, test } from "bun:test";
import { conversationRepository } from "@server/repositories/ConversationRepository";
import { ConversationTypeEnum } from "@shared/types";
import { createConversation } from "../helpers/fixtures";
import { resetDatabase } from "../helpers/testDatabase";

describe("ConversationRepository", () => {
	beforeEach(resetDatabase);

	test("supports CRUD operations", async () => {
		expect(
			await conversationRepository.getOne(
				"00000000-0000-0000-0000-000000000000",
			),
		).toBeNull();

		const created = await conversationRepository.create({
			type: ConversationTypeEnum.Group,
		});

		expect(created).not.toBeNull();
		expect((await conversationRepository.getOne(created!.id))?.type).toBe(
			ConversationTypeEnum.Group,
		);
		expect(await conversationRepository.getAll()).toHaveLength(1);

		const updated = await conversationRepository.update(created!.id, {
			type: ConversationTypeEnum.Direct,
		});
		expect(updated.type).toBe(ConversationTypeEnum.Direct);
		await expect(
			conversationRepository.update("00000000-0000-0000-0000-000000000000", {
				type: ConversationTypeEnum.Pulse,
			}),
		).rejects.toThrow(
			"ConversationRepository: Record with id 00000000-0000-0000-0000-000000000000 not found",
		);

		expect(await conversationRepository.delete(created!.id)).toBe(true);
		expect(await conversationRepository.delete(created!.id)).toBe(false);
	});

	test("lists every conversation", async () => {
		await createConversation();
		await createConversation({ type: ConversationTypeEnum.Pulse });

		expect(await conversationRepository.getAll()).toHaveLength(2);
	});
});
