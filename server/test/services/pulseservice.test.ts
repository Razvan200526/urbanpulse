import { afterEach, describe, expect, mock, spyOn, test } from "bun:test";
import type { PulseType } from "@server/db/schema";
import { notificationService } from "@server/services/NotificationService";
import { PulseService } from "@server/services/PulseService";
import {
	PulseEnum,
	PulseStatusEnum,
	PulseUploadStateEnum,
	UrgencyEnum,
} from "@shared/types";

function buildPulse(overrides: Partial<PulseType> = {}): PulseType {
	return {
		id: "11111111-1111-1111-1111-111111111111",
		userId: "user-1",
		type: PulseEnum.Emergency,
		urgency: UrgencyEnum.Urgent,
		title: "Need help",
		description: "Nearby assistance needed",
		position: { x: 26.1025, y: 44.4268 } as PulseType["position"],
		status: PulseStatusEnum.Active,
		pulseUploadState: PulseUploadStateEnum.Pending,
		audioUrl: null,
		imageUrls: [],
		isResolved: false,
		isVerified: false,
		createdAt: new Date("2025-01-01T00:00:00.000Z"),
		...overrides,
	};
}

function createServiceWithRepo(repoOverrides: Record<string, unknown> = {}) {
	const service = new PulseService();
	const repo = {
		getOne: mock(),
		create: mock(),
		update: mock(),
		getByOptions: mock(),
		...repoOverrides,
	};

	(service as any).pulseRepository = repo;

	return {
		service,
		repo,
	};
}

afterEach(() => {
	mock.restore();
});

describe("PulseService", () => {
	test("gets a pulse by id", async () => {
		const pulse = buildPulse();
		const { service, repo } = createServiceWithRepo({
			getOne: mock(async () => pulse),
		});

		await expect(service.getPulseById(pulse.id)).resolves.toEqual(pulse);
		expect(repo.getOne).toHaveBeenCalledWith(pulse.id);
	});

	test("creates a pulse and returns null when creation fails", async () => {
		const pulse = buildPulse();
		const { service, repo } = createServiceWithRepo({
			create: mock(async () => pulse),
		});

		await expect(service.createPulse({ title: pulse.title })).resolves.toEqual(
			pulse,
		);
		expect(repo.create).toHaveBeenCalledWith({ title: pulse.title });

		repo.create = mock(async () => {
			throw new Error("db down");
		});

		await expect(service.createPulse({ title: "Broken" })).resolves.toBeNull();
	});

	test("updates a pulse and returns null when update fails", async () => {
		const updatedPulse = buildPulse({ title: "Updated title" });
		const { service, repo } = createServiceWithRepo({
			update: mock(async () => updatedPulse),
		});

		await expect(
			service.updatePulse(updatedPulse.id, { title: updatedPulse.title }),
		).resolves.toEqual(updatedPulse);
		expect(repo.update).toHaveBeenCalledWith(updatedPulse.id, {
			title: updatedPulse.title,
		});

		repo.update = mock(async () => {
			throw new Error("write failed");
		});

		await expect(
			service.updatePulse(updatedPulse.id, { title: "Nope" }),
		).resolves.toBeNull();
	});

	test("only lets the owner update a pulse", async () => {
		const existing = buildPulse({ userId: "owner-1" });
		const { service, repo } = createServiceWithRepo({
			getOne: mock(async () => existing),
			update: mock(async () => existing),
		});

		await expect(
			service.updatePulseAsOwner(existing.id, "someone-else", {
				status: PulseStatusEnum.Dismissed,
			}),
		).resolves.toBeNull();
		expect(repo.update).not.toHaveBeenCalled();
	});

	test("returns null when the pulse does not exist for owner updates", async () => {
		const { service, repo } = createServiceWithRepo({
			getOne: mock(async () => null),
		});

		await expect(
			service.updatePulseAsOwner("missing-pulse", "owner-1", {
				status: PulseStatusEnum.Active,
			}),
		).resolves.toBeNull();
		expect(repo.update).not.toHaveBeenCalled();
	});

	test("marks the pulse as resolved when the owner resolves it", async () => {
		const existing = buildPulse({ userId: "owner-1" });
		const resolvedPulse = buildPulse({
			userId: "owner-1",
			status: PulseStatusEnum.Resolved,
			isResolved: true,
		});
		const { service, repo } = createServiceWithRepo({
			getOne: mock(async () => existing),
			update: mock(async () => resolvedPulse),
		});

		await expect(
			service.updatePulseAsOwner(existing.id, "owner-1", {
				status: PulseStatusEnum.Resolved,
			}),
		).resolves.toEqual(resolvedPulse);
		expect(repo.update).toHaveBeenCalledWith(existing.id, {
			status: PulseStatusEnum.Resolved,
			isResolved: true,
		});
	});

	test("returns null when owner update persistence fails", async () => {
		const existing = buildPulse({ userId: "owner-1" });
		const { service } = createServiceWithRepo({
			getOne: mock(async () => existing),
			update: mock(async () => {
				throw new Error("write failed");
			}),
		});

		await expect(
			service.updatePulseAsOwner(existing.id, "owner-1", {
				isResolved: true,
			}),
		).resolves.toBeNull();
	});

	test("retrieves only active nearby pulses with the default radius", async () => {
		const pulses = [buildPulse()];
		const { service, repo } = createServiceWithRepo({
			getByOptions: mock(async () => pulses),
		});

		await expect(
			service.getPulses({ position: { x: 26.1, y: 44.4 } }),
		).resolves.toEqual(pulses);
		expect(repo.getByOptions).toHaveBeenCalledWith({
			x: 26.1,
			y: 44.4,
			radius: 500,
			status: PulseStatusEnum.Active,
		});
	});

	test("returns null when pulse retrieval fails", async () => {
		const { service } = createServiceWithRepo({
			getByOptions: mock(async () => {
				throw new Error("read failed");
			}),
		});

		await expect(
			service.getPulses({ position: { x: 26.1, y: 44.4 } }),
		).resolves.toBeNull();
	});

	test("rejects invalid socket messages", async () => {
		const { service } = createServiceWithRepo();

		await expect(
			service.handleSocketMessage({ type: "upload-pulse", payload: {} }),
		).resolves.toEqual({
			success: false,
			message: "Invalid request",
			data: null,
		});
	});

	test("handles get-pulses socket requests", async () => {
		const pulses = [buildPulse()];
		const { service } = createServiceWithRepo();
		const getPulsesSpy = spyOn(service, "getPulses").mockResolvedValue(pulses);

		await expect(
			service.handleSocketMessage({
				type: "get-pulses",
				payload: {
					userId: "user-1",
					position: { x: 26.1, y: 44.4 },
				},
			}),
		).resolves.toEqual({
			success: true,
			message: "Pulses retrieved",
			data: pulses,
		});

		expect(getPulsesSpy).toHaveBeenCalledWith({
			position: { x: 26.1, y: 44.4 },
		});
	});

	test("returns an empty list when get-pulses produces no data", async () => {
		const { service } = createServiceWithRepo();
		spyOn(service, "getPulses").mockResolvedValue(null);

		await expect(
			service.handleSocketMessage({
				type: "get-pulses",
				payload: {
					userId: "user-1",
					position: { x: 26.1, y: 44.4 },
				},
			}),
		).resolves.toEqual({
			success: true,
			message: "Pulses retrieved",
			data: [],
		});
	});

	test("returns an error when upload-pulse creation fails", async () => {
		const { service } = createServiceWithRepo();
		spyOn(service, "createPulse").mockResolvedValue(null);

		await expect(
			service.handleSocketMessage({
				type: "upload-pulse",
				payload: {
					userId: "user-1",
					type: PulseEnum.Emergency,
					urgency: UrgencyEnum.Urgent,
					title: "Need help",
					description: "Nearby assistance needed",
					position: { x: 26.1, y: 44.4 },
					imageUrls: [],
				},
			}),
		).resolves.toEqual({
			success: false,
			message: "Failed to create pulse",
			data: null,
		});
	});

	test("returns an error when upload-pulse upload-state update fails", async () => {
		const pendingPulse = buildPulse();
		const { service } = createServiceWithRepo();
		spyOn(service, "createPulse").mockResolvedValue(pendingPulse);
		spyOn(service, "updatePulse").mockResolvedValue(null);

		await expect(
			service.handleSocketMessage({
				type: "upload-pulse",
				payload: {
					userId: "user-1",
					type: PulseEnum.Emergency,
					urgency: UrgencyEnum.Urgent,
					title: "Need help",
					description: "Nearby assistance needed",
					position: { x: 26.1, y: 44.4 },
					imageUrls: [],
				},
			}),
		).resolves.toEqual({
			success: false,
			message: "Failed to update pulse upload state",
			data: null,
		});
	});

	test("handles upload-pulse socket requests and broadcasts the uploaded pulse", async () => {
		const pendingPulse = buildPulse();
		const uploadedPulse = buildPulse({
			pulseUploadState: PulseUploadStateEnum.Uploaded,
		});
		const { service } = createServiceWithRepo();
		const createPulseSpy = spyOn(service, "createPulse").mockResolvedValue(
			pendingPulse,
		);
		const updatePulseSpy = spyOn(service, "updatePulse").mockResolvedValue(
			uploadedPulse,
		);
		const broadcastSpy = spyOn(
			notificationService,
			"broadcastToNearbyUsers",
		).mockResolvedValue(undefined);

		await expect(
			service.handleSocketMessage({
				type: "upload-pulse",
				payload: {
					userId: "user-1",
					type: PulseEnum.Emergency,
					urgency: UrgencyEnum.Urgent,
					title: "Need help",
					description: "Nearby assistance needed",
					position: { x: 26.1, y: 44.4 },
					imageUrls: [],
				},
			}),
		).resolves.toEqual({
			success: true,
			message: "Pulse received",
			data: uploadedPulse,
		});

		expect(createPulseSpy).toHaveBeenCalled();
		expect(updatePulseSpy).toHaveBeenCalledWith(pendingPulse.id, {
			pulseUploadState: PulseUploadStateEnum.Uploaded,
		});
		expect(broadcastSpy).toHaveBeenCalledWith(uploadedPulse);
	});
});
