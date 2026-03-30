import { beforeEach, describe, expect, spyOn, test } from "bun:test";
import { pulseRepository } from "@server/repositories/PulseRepository";
import { PulseEnum, UrgencyEnum } from "@shared/types";
import { createPulse, createUser } from "../helpers/fixtures";
import { resetDatabase } from "../helpers/testDatabase";

describe("PulseRepository", () => {
	beforeEach(resetDatabase);

	test("supports CRUD operations and returns null on invalid create", async () => {
		const user = await createUser();
		expect(
			await pulseRepository.getOne("00000000-0000-0000-0000-000000000000"),
		).toBeNull();

		const created = await pulseRepository.create({
			userId: user.id,
			type: PulseEnum.Item,
			urgency: UrgencyEnum.Immediate,
			title: "Need supplies",
			position: { x: 26.1, y: 44.4 } as any,
			imageUrls: [],
		});

		expect(created).not.toBeNull();
		expect((await pulseRepository.getOne(created!.id))?.title).toBe(
			"Need supplies",
		);
		expect(await pulseRepository.getAll()).toHaveLength(1);

		const updated = await pulseRepository.update(created!.id, {
			title: "Need water",
		});
		expect(updated.title).toBe("Need water");
		expect(
			pulseRepository.update("00000000-0000-0000-0000-000000000000", {
				title: "Nope",
			}),
		).rejects.toThrow(
			"PulseRepository: Record with id 00000000-0000-0000-0000-000000000000 not found",
		);

		const errorSpy = spyOn(console, "error").mockImplementation(() => {});
		try {
			expect(
				await pulseRepository.create({
					userId: "missing-user",
					urgency: UrgencyEnum.Urgent,
					title: "Broken",
					position: { x: 26.1, y: 44.4 } as any,
					imageUrls: [],
				}),
			).toBeNull();
		} finally {
			errorSpy.mockRestore();
		}

		expect(await pulseRepository.delete(created!.id)).toBe(true);
		expect(await pulseRepository.delete(created!.id)).toBe(false);
	});

	test("filters pulses by attributes and radius", async () => {
		const user = await createUser();
		const nearby = await createPulse({
			userId: user.id,
			title: "Nearby",
			position: { x: 26.1025, y: 44.4268 } as any,
		});
		await createPulse({
			userId: user.id,
			title: "Far",
			position: { x: 27.1025, y: 45.4268 } as any,
		});

		const byUser = await pulseRepository.getByOptions({
			userId: user.id,
			title: "Nearby",
		});
		expect(byUser).toHaveLength(1);
		expect(byUser[0]?.id).toBe(nearby.id);

		const byRadius = await pulseRepository.getByOptions({
			x: 26.1025,
			y: 44.4268,
			radius: 500,
		});
		expect(byRadius.map((pulse) => pulse.title)).toContain("Nearby");
		expect(byRadius.map((pulse) => pulse.title)).not.toContain("Far");
	});
});
