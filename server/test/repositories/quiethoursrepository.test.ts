import { beforeEach, describe, expect, test } from "bun:test";
import { quietHoursRepository } from "@server/repositories/QuietHoursRepository";
import { createQuietHours, createUser } from "../helpers/fixtures";
import { resetDatabase } from "../helpers/testDatabase";

describe("QuietHoursRepository", () => {
	beforeEach(resetDatabase);

	test("supports CRUD operations", async () => {
		const user = await createUser();
		expect(
			await quietHoursRepository.getOne("00000000-0000-0000-0000-000000000000"),
		).toBeNull();

		const created = await quietHoursRepository.create({
			userId: user.id,
			startTime: "21:00:00",
			endTime: "07:00:00",
			days: "Mon,Fri",
		});

		expect(created).not.toBeNull();
		expect((await quietHoursRepository.getOne(created!.id))?.days).toBe(
			"Mon,Fri",
		);
		expect(await quietHoursRepository.getAll()).toHaveLength(1);

		const updated = await quietHoursRepository.update(created!.id, {
			days: "Mon,Tue,Fri",
		});
		expect(updated.days).toBe("Mon,Tue,Fri");
		await expect(
			quietHoursRepository.update("00000000-0000-0000-0000-000000000000", {
				days: "Sun",
			}),
		).rejects.toThrow(
			"QuietHoursRepository: Record with id 00000000-0000-0000-0000-000000000000 not found",
		);

		expect(await quietHoursRepository.delete(created!.id)).toBe(true);
		expect(await quietHoursRepository.delete(created!.id)).toBe(false);
	});

	test("returns all quiet hours", async () => {
		await createQuietHours();
		await createQuietHours();

		expect(await quietHoursRepository.getAll()).toHaveLength(2);
	});
});
