import { beforeEach, describe, expect, test } from "bun:test";
import { incidentTypeRepository } from "@server/repositories/IncidentTypeRepository";
import { resetDatabase } from "../helpers/testDatabase";

describe("IncidentTypeRepository", () => {
	beforeEach(resetDatabase);

	test("creates, sorts, filters, updates, and soft-deactivates incident types", async () => {
		const fire = await incidentTypeRepository.create({
			slug: "fire",
			label: "Fire",
			description: "Active fire",
			isActive: true,
			isSystem: true,
			sortOrder: 20,
		});
		const blackout = await incidentTypeRepository.create({
			slug: "blackout-power-outage",
			label: "Blackout / power outage",
			description: "Power loss",
			isActive: false,
			isSystem: true,
			sortOrder: 10,
		});

		expect(fire).not.toBeNull();
		expect(blackout).not.toBeNull();
		expect((await incidentTypeRepository.getOne(fire!.id))?.slug).toBe("fire");
		expect((await incidentTypeRepository.getBySlug("fire"))?.label).toBe(
			"Fire",
		);
		expect(
			(await incidentTypeRepository.getAll()).map((entry) => entry.slug),
		).toEqual(["blackout-power-outage", "fire"]);
		expect(
			(await incidentTypeRepository.getActive()).map((entry) => entry.slug),
		).toEqual(["fire"]);

		const updated = await incidentTypeRepository.update(fire!.id, {
			label: "Structure fire",
		});
		expect(updated.label).toBe("Structure fire");

		expect(await incidentTypeRepository.delete(fire!.id)).toBe(true);
		expect((await incidentTypeRepository.getOne(fire!.id))?.isActive).toBe(
			false,
		);
	});
});
