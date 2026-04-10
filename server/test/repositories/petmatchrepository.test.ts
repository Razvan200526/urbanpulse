import { beforeEach, describe, expect, test } from "bun:test";
import { petMatchRepository } from "@server/repositories/PetMatchRepository";
import { PetAlertTypeEnum } from "@shared/types";
import { createPetAlert, createPetMatch } from "../helpers/fixtures";
import { resetDatabase } from "../helpers/testDatabase";

describe("PetMatchRepository", () => {
	beforeEach(resetDatabase);

	test("supports CRUD operations", async () => {
		const lostAlert = await createPetAlert({
			alertType: PetAlertTypeEnum.Lost,
		});
		const foundAlert = await createPetAlert({
			alertType: PetAlertTypeEnum.Found,
		});

		expect(
			await petMatchRepository.getOne("00000000-0000-0000-0000-000000000000"),
		).toBeNull();

		const created = await petMatchRepository.create({
			lostAlertId: lostAlert.id,
			foundAlertId: foundAlert.id,
			confidenceScore: 0.75,
			imageSimilarity: 0.8,
			matchedAttributes: ["species"],
		});

		expect(created).not.toBeNull();
		expect(
			(await petMatchRepository.getOne(created!.id))?.confidenceScore,
		).toBe(0.75);
		expect(await petMatchRepository.getAll()).toHaveLength(1);

		const updated = await petMatchRepository.update(created!.id, {
			confidenceScore: 0.88,
			imageSimilarity: 0.9,
			matchedAttributes: ["species", "color"],
		});
		expect(updated.confidenceScore).toBe(0.88);
		expect(updated.imageSimilarity).toBe(0.9);
		await expect(
			petMatchRepository.update("00000000-0000-0000-0000-000000000000", {
				confidenceScore: 0.5,
				imageSimilarity: 0.5,
				matchedAttributes: [],
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
