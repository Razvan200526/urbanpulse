import { beforeEach, describe, expect, test } from "bun:test";
import { skillRepository } from "@server/repositories/SkillRepository";
import { createSkill, createUser } from "../helpers/fixtures";
import { resetDatabase } from "../helpers/testDatabase";

describe("SkillRepository", () => {
	beforeEach(resetDatabase);

	test("supports CRUD operations", async () => {
		const user = await createUser();
		expect(
			await skillRepository.getOne("00000000-0000-0000-0000-000000000000"),
		).toBeNull();

		const created = await skillRepository.create({
			tag: "plumbing",
			userId: user.id,
		});

		expect(created).not.toBeNull();
		expect((await skillRepository.getOne(created!.id))?.tag).toBe("plumbing");
		expect(await skillRepository.getAll()).toHaveLength(1);

		const updated = await skillRepository.update(created!.id, {
			tag: "first-aid",
		});
		expect(updated.tag).toBe("first-aid");
		await expect(
			skillRepository.update("00000000-0000-0000-0000-000000000000", {
				tag: "none",
			}),
		).rejects.toThrow(
			"SkillRepository: Record with id 00000000-0000-0000-0000-000000000000 not found",
		);

		expect(await skillRepository.delete(created!.id)).toBe(true);
		expect(await skillRepository.delete(created!.id)).toBe(false);
	});

	test("returns all skills", async () => {
		await createSkill();
		await createSkill();

		expect(await skillRepository.getAll()).toHaveLength(2);
	});
});
