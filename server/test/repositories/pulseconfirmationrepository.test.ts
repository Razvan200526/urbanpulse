import { beforeEach, describe, expect, test } from "bun:test";
import { pulseConfirmationRepository } from "@server/repositories/PulseConfirmationRepository";
import {
	createPulse,
	createPulseConfirmation,
	createUser,
} from "../helpers/fixtures";
import { resetDatabase } from "../helpers/testDatabase";

describe("PulseConfirmationRepository", () => {
	beforeEach(resetDatabase);

	test("supports CRUD operations", async () => {
		const pulse = await createPulse();
		const user = await createUser();

		expect(
			await pulseConfirmationRepository.getOne(
				"00000000-0000-0000-0000-000000000000",
			),
		).toBeNull();

		const created = await pulseConfirmationRepository.create({
			pulseId: pulse.id,
			userId: user.id,
		});

		expect(created).not.toBeNull();
		expect(
			(await pulseConfirmationRepository.getOne(created!.id))?.userId,
		).toBe(user.id);
		expect(await pulseConfirmationRepository.getAll()).toHaveLength(1);

		const replacementUser = await createUser();
		const updated = await pulseConfirmationRepository.update(created!.id, {
			userId: replacementUser.id,
		});
		expect(updated.userId).toBe(replacementUser.id);
		await expect(
			pulseConfirmationRepository.update(
				"00000000-0000-0000-0000-000000000000",
				{
					userId: replacementUser.id,
				},
			),
		).rejects.toThrow(
			"PulseConfirmationRepository: Record with id 00000000-0000-0000-0000-000000000000 not found",
		);

		expect(await pulseConfirmationRepository.delete(created!.id)).toBe(true);
		expect(await pulseConfirmationRepository.delete(created!.id)).toBe(false);
	});

	test("returns all confirmations", async () => {
		await createPulseConfirmation();
		await createPulseConfirmation();

		expect(await pulseConfirmationRepository.getAll()).toHaveLength(2);
	});
});
