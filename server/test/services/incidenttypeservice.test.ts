import { beforeEach, describe, expect, test } from "bun:test";
import { incidentTypeRepository } from "@server/repositories/IncidentTypeRepository";
import { incidentTypeService } from "@server/services/IncidentTypeService";
import { DefaultIncidentTypeSlugEnum, PulseEnum } from "@shared/types";
import { resetDatabase } from "../helpers/testDatabase";

const createIncidentType = async (
	overrides: Parameters<typeof incidentTypeRepository.create>[0] = {},
) =>
	incidentTypeRepository.create({
		slug: DefaultIncidentTypeSlugEnum.Other,
		label: "Other",
		description: "Fallback",
		isActive: true,
		isSystem: true,
		sortOrder: 80,
		...overrides,
	});

describe("IncidentTypeService", () => {
	beforeEach(resetDatabase);

	test("returns only active incident types", async () => {
		await createIncidentType();
		await createIncidentType({
			slug: "retired",
			label: "Retired",
			isActive: false,
			isSystem: false,
			sortOrder: 90,
		});

		expect(
			(await incidentTypeService.listActiveIncidentTypes()).map(
				(entry) => entry.slug,
			),
		).toEqual([DefaultIncidentTypeSlugEnum.Other]);
	});

	test("rejects duplicate slugs when creating custom incident types", async () => {
		await createIncidentType({ slug: "fire", label: "Fire", sortOrder: 10 });

		await expect(
			incidentTypeService.createIncidentType({
				label: "Fire",
				description: "",
			}),
		).resolves.toEqual({
			ok: false,
			code: "CONFLICT",
			message: "An incident type with this name already exists",
		});
	});

	test("uses Other as the emergency fallback and clears non-emergency subtypes", async () => {
		const other = await createIncidentType();

		await expect(
			incidentTypeService.resolveIncidentTypeIdForPulse(PulseEnum.Emergency),
		).resolves.toEqual({
			ok: true,
			data: { incidentTypeId: other!.id },
		});

		await expect(
			incidentTypeService.resolveIncidentTypeIdForPulse(
				PulseEnum.Skill,
				other!.id,
			),
		).resolves.toEqual({
			ok: true,
			data: { incidentTypeId: null },
		});
	});

	test("rejects inactive incident types for emergency pulses", async () => {
		const inactive = await createIncidentType({
			slug: "inactive",
			label: "Inactive",
			isActive: false,
		});
		await createIncidentType();

		await expect(
			incidentTypeService.resolveIncidentTypeIdForPulse(
				PulseEnum.Emergency,
				inactive!.id,
			),
		).resolves.toEqual({
			ok: false,
			code: "NOT_FOUND",
			message: "Incident type not found or inactive",
		});
	});

	test("keeps the Other fallback active", async () => {
		const other = await createIncidentType();

		await expect(
			incidentTypeService.updateIncidentType(other!.id, { isActive: false }),
		).resolves.toEqual({
			ok: false,
			code: "INVALID_STATE",
			message: "The fallback incident type must remain active",
		});
	});
});
