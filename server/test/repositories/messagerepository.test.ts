import { beforeEach, describe, expect, test } from "bun:test";
import { messageRepository } from "@server/repositories/MessageRepository";
import {
	createConversation,
	createMessage,
	createUser,
} from "../helpers/fixtures";
import { resetDatabase } from "../helpers/testDatabase";

describe("MessageRepository", () => {
	beforeEach(resetDatabase);

	test("supports CRUD operations", async () => {
		const conversation = await createConversation();
		const sender = await createUser();

		expect(
			await messageRepository.getOne("00000000-0000-0000-0000-000000000000"),
		).toBeNull();

		const created = await messageRepository.create({
			conversationId: conversation.id,
			senderId: sender.id,
			content: "hello",
		});

		expect(created).not.toBeNull();
		expect((await messageRepository.getOne(created!.id))?.content).toBe(
			"hello",
		);
		expect(await messageRepository.getAll()).toHaveLength(1);

		const updated = await messageRepository.update(created!.id, {
			content: "updated",
		});
		expect(updated.content).toBe("updated");
		await expect(
			messageRepository.update("00000000-0000-0000-0000-000000000000", {
				content: "nope",
			}),
		).rejects.toThrow(
			"MessageRepository: Record with id 00000000-0000-0000-0000-000000000000 not found",
		);

		expect(await messageRepository.delete(created!.id)).toBe(true);
		expect(await messageRepository.delete(created!.id)).toBe(false);
	});

	test("returns all messages", async () => {
		await createMessage();
		await createMessage();

		expect(await messageRepository.getAll()).toHaveLength(2);
	});
});
