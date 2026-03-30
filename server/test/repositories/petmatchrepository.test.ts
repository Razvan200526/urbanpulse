import { beforeEach, describe, expect, test } from "bun:test";
import { petMatchRepository } from "@server/repositories/PetMatchRepository";
import { createPetAlert, createPetMatch } from "../helpers/fixtures";
import { resetDatabase } from "../helpers/testDatabase";

describe("PetMatchRepository", () => {
	beforeEach(resetDatabase);

	test("supports CRUD operations", async () => {
		const lostAlert = await createPetAlert();
		const foundAlert = await createPetAlert();

		expect(
			await petMatchRepository.getOne("00000000-0000-0000-0000-000000000000"),
		).toBeNull();

		const created = await petMatchRepository.create({
			lostAlertId: lostAlert.id,
			foundAlertId: foundAlert.id,
			confidenceScore: 0.75,
		});

		expect(created).not.toBeNull();
		expect(
			(await petMatchRepository.getOne(created!.id))?.confidenceScore,
		).toBe(0.75);
		expect(await petMatchRepository.getAll()).toHaveLength(1);

		const updated = await petMatchRepository.update(created!.id, {
			confidenceScore: 0.88,
		});
		expect(updated.confidenceScore).toBe(0.88);
		await expect(
			petMatchRepository.update("00000000-0000-0000-0000-000000000000", {
				confidenceScore: 0.5,
			}),
		).rejects.toThrow(
			"PetMatchRepository: Record with id 00000000-0000-0000-0000-000000000000 not found",
		);

		expect(await petMatchRepository.delete(created!.id)).toBe(true);
		expect(await petMatchRepository.delete(created!.id)).toBe(false);
	});

	test("returns all pet matches", async () => {
		await createPetMatch();
		await createPetMatch();

		expect(await petMatchRepository.getAll()).toHaveLength(2);
	});
});
