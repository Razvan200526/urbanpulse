import { afterEach, describe, expect, mock, spyOn, test } from "bun:test";
import type { ResourceType } from "@server/db/schema";
import { locationService } from "@server/services/LocationService";
import { ResourceService } from "@server/services/ResourceService";
import type { CreateResourcePayload } from "@shared/validators/resources/isResourceValid";

const validPayload: CreateResourcePayload = {
	name: "Community room",
	description: "A shared room for residents",
	availability: "Available",
	resourceType: "Location",
	position: { x: 26.1, y: 44.4 },
	imageUrls: [],
};

function buildResource(
	overrides: Partial<ResourceType> = {},
): ResourceType {
	return {
		id: "11111111-1111-1111-1111-111111111111",
		userId: "owner-1",
		name: "Community room",
		description: "A shared room for residents",
		availability: "Available",
		position: { x: 26.1, y: 44.4 } as ResourceType["position"],
		locationLabel: null,
		resourceType: "Location",
		imageUrls: [],
		createdAt: new Date("2025-01-01T00:00:00.000Z"),
		...overrides,
	};
}

function createServiceWithRepo() {
	const service = new ResourceService();
	const repo = {
		create: mock(async (resource: Partial<ResourceType>) =>
			buildResource(resource),
		),
	};

	(service as any).resourceRepo = repo;

	return { service, repo };
}

afterEach(() => {
	mock.restore();
});

describe("ResourceService", () => {
	test("persists the session user id with resource type and position", async () => {
		const { service, repo } = createServiceWithRepo();
		spyOn(locationService, "getAddressByCoords").mockResolvedValue(undefined);

		await expect(
			service.createResource("owner-1", validPayload),
		).resolves.toEqual(
			expect.objectContaining({
				userId: "owner-1",
				resourceType: "Location",
				position: { x: 26.1, y: 44.4 },
			}),
		);
		expect(repo.create).toHaveBeenCalledWith({
			...validPayload,
			userId: "owner-1",
		});
	});

	test("uses a provided location label without reverse geocoding", async () => {
		const { service, repo } = createServiceWithRepo();
		const geocodeSpy = spyOn(locationService, "getAddressByCoords");

		await service.createResource("owner-1", {
			...validPayload,
			locationLabel: "Community Center",
		});

		expect(geocodeSpy).not.toHaveBeenCalled();
		expect(repo.create).toHaveBeenCalledWith({
			...validPayload,
			locationLabel: "Community Center",
			userId: "owner-1",
		});
	});

	test("fills a missing location label from reverse geocoding", async () => {
		const { service, repo } = createServiceWithRepo();
		spyOn(locationService, "getAddressByCoords").mockResolvedValue(
			"Strada Exemplu 10",
		);

		await service.createResource("owner-1", validPayload);

		expect(repo.create).toHaveBeenCalledWith({
			...validPayload,
			locationLabel: "Strada Exemplu 10",
			userId: "owner-1",
		});
	});

	test("still creates the resource when reverse geocoding fails", async () => {
		const { service, repo } = createServiceWithRepo();
		spyOn(locationService, "getAddressByCoords").mockRejectedValue(
			new Error("mapbox unavailable"),
		);

		await expect(
			service.createResource("owner-1", validPayload),
		).resolves.toEqual(
			expect.objectContaining({
				userId: "owner-1",
				locationLabel: null,
			}),
		);

		const [createdPayload] = repo.create.mock.calls[0] ?? [];
		expect(createdPayload).toEqual({
			...validPayload,
			userId: "owner-1",
		});
	});
});
