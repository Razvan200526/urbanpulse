import { beforeEach, describe, expect, test } from "bun:test";
import { petAlertRepository } from "@server/repositories/PetAlertRepository";
import { createPetAlert, createPulse } from "../helpers/fixtures";
import { resetDatabase } from "../helpers/testDatabase";

describe("PetAlertRepository", () => {
	beforeEach(resetDatabase);

	test("supports CRUD operations", async () => {
		const pulse = await createPulse();

		expect(
			await petAlertRepository.getOne("00000000-0000-0000-0000-000000000000"),
		).toBeNull();

		const created = await petAlertRepository.create({
			pulseId: pulse.id,
			petType: "Dog",
			color: "Black",
		});

		expect(created).not.toBeNull();
		expect((await petAlertRepository.getOne(created!.id))?.color).toBe("Black");
		expect(await petAlertRepository.getAll()).toHaveLength(1);

		const updated = await petAlertRepository.update(created!.id, {
			color: "White",
		});
		expect(updated.color).toBe("White");
		await expect(
			petAlertRepository.update("00000000-0000-0000-0000-000000000000", {
				color: "Gray",
			}),
		).rejects.toThrow(
			"PetAlertRepository: Record with id 00000000-0000-0000-0000-000000000000 not found",
		);

		expect(await petAlertRepository.delete(created!.id)).toBe(true);
		expect(await petAlertRepository.delete(created!.id)).toBe(false);
	});

	test("returns all pet alerts", async () => {
		await createPetAlert();
		await createPetAlert();

		expect(await petAlertRepository.getAll()).toHaveLength(2);
	});
});
