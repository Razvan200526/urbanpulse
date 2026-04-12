import { afterEach, describe, expect, mock, spyOn, test } from "bun:test";
import type {
	ResourceReviewType,
	ResourceType,
	TransactionType,
	UserType,
} from "@server/db/schema";
import { cacheManager } from "@server/services/cache/CacheManager";
import { locationService } from "@server/services/LocationService";
import { notificationService } from "@server/services/NotificationService";
import { ResourceService } from "@server/services/ResourceService";
import { TransactionStatusEnum } from "@shared/types";
import type {
	CreateResourcePayload,
	UpdateResourcePayload,
} from "@shared/validators/resources/isResourceValid";

const validPayload: CreateResourcePayload = {
	name: "Community room",
	description: "A shared room for residents",
	availability: "Available",
	resourceType: "Location",
	position: { x: 26.1, y: 44.4 },
	imageUrls: [],
};

const validUpdatePayload: UpdateResourcePayload = {
	name: "Updated community room",
	description: "A shared room with new booking details",
	availability: "Unavailable",
	resourceType: "Location",
	imageUrls: [],
};

function buildResource(overrides: Partial<ResourceType> = {}): ResourceType {
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

function buildTransaction(
	overrides: Partial<TransactionType> = {},
): TransactionType {
	return {
		id: "22222222-2222-2222-2222-222222222222",
		resourceId: "11111111-1111-1111-1111-111111111111",
		borrowerId: "borrower-1",
		lenderId: "owner-1",
		status: TransactionStatusEnum.Pending,
		startAt: new Date("2025-01-01T00:00:00.000Z"),
		endAt: null,
		...overrides,
	};
}

function buildUser(overrides: Partial<UserType> = {}): UserType {
	return {
		id: "borrower-1",
		name: "Borrower",
		email: "borrower@example.com",
		emailVerified: true,
		image: null,
		role: "user",
		rememberMe: null,
		bio: null,
		trustScore: 0,
		successfulInteractions: 0,
		failedInteractions: 0,
		isVerified: false,
		homeLocation: null,
		lastKnownLocation: null,
		lastKnownLocationUpdatedAt: null,
		heroAlertRadiusMeters: 500,
		banned: false,
		banReason: null,
		banExpires: null,
		createdAt: new Date("2025-01-01T00:00:00.000Z"),
		updatedAt: new Date("2025-01-01T00:00:00.000Z"),
		...overrides,
	};
}

function buildReview(
	overrides: Partial<ResourceReviewType> = {},
): ResourceReviewType {
	return {
		id: "33333333-3333-3333-3333-333333333333",
		transactionId: "22222222-2222-2222-2222-222222222222",
		resourceId: "11111111-1111-1111-1111-111111111111",
		reviewerId: "borrower-1",
		revieweeId: "owner-1",
		rating: 5,
		comment: null,
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

function createServiceForTransactions({
	resource = buildResource(),
	transaction = buildTransaction(),
	borrower = buildUser(),
	owner = buildUser({
		id: "owner-1",
		name: "Owner",
		email: "owner@example.com",
	}),
}: {
	resource?: ResourceType | null;
	transaction?: TransactionType | null;
	borrower?: UserType | null;
	owner?: UserType | null;
} = {}) {
	const service = new ResourceService();
	const resourceRepo = {
		getOne: mock(async () => resource),
		update: mock(async (_id: string, data: Partial<ResourceType>) => ({
			...(resource ?? buildResource()),
			...data,
		})),
	};
	const transactionRepo = {
		create: mock(async (data: Partial<TransactionType>) =>
			buildTransaction(data),
		),
		getOne: mock(async () => transaction),
		update: mock(async (_id: string, data: Partial<TransactionType>) =>
			buildTransaction({
				...(transaction ?? buildTransaction()),
				...data,
			}),
		),
		getByResourceAndBorrowerId: mock(async () => []),
		cancelPendingByResourceId: mock(async () => []),
	};
	const userRepo = {
		getOne: mock(async (id: string) => {
			if (borrower?.id === id) {
				return borrower;
			}
			if (owner?.id === id) {
				return owner;
			}
			return null;
		}),
		update: mock(async (id: string, data: Partial<UserType>) => {
			if (borrower?.id === id) {
				return { ...borrower, ...data };
			}
			if (owner?.id === id) {
				return { ...owner, ...data };
			}
			return null;
		}),
	};
	const reviewRepo = {
		getLatestByRevieweeId: mock(async () => []),
		getSummaryByResourceId: mock(async () => ({
			averageRating: null,
			count: 0,
		})),
		getByTransactionId: mock(async () => null),
		create: mock(async (data: Partial<ResourceReviewType>) =>
			buildReview(data),
		),
	};

	(service as any).resourceRepo = resourceRepo;
	(service as any).transactionRepo = transactionRepo;
	(service as any).userRepo = userRepo;
	(service as any).reviewRepo = reviewRepo;

	return { service, resourceRepo, transactionRepo, userRepo, reviewRepo };
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

	test("invalidates owner resource caches after creating a resource", async () => {
		const { service } = createServiceWithRepo();
		const invalidateSpy = spyOn(cacheManager, "invalidate").mockResolvedValue(
			undefined,
		);
		const invalidatePatternSpy = spyOn(
			cacheManager,
			"invalidatePattern",
		).mockResolvedValue(undefined);
		spyOn(locationService, "getAddressByCoords").mockResolvedValue(undefined);

		const createdResource = await service.createResource(
			"owner-1",
			validPayload,
		);

		expect(invalidateSpy).toHaveBeenCalledWith(createdResource?.id, {
			namespace: "resource",
		});
		expect(invalidatePatternSpy).toHaveBeenCalledWith("owner-1:*", "resource");
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

	test("updates resource metadata for the owner", async () => {
		const resource = buildResource({ userId: "owner-1" });
		const { service, resourceRepo } = createServiceForTransactions({
			resource,
		});

		await expect(
			service.updateResource(resource.id, "owner-1", validUpdatePayload),
		).resolves.toEqual(
			expect.objectContaining({
				id: resource.id,
				...validUpdatePayload,
			}),
		);
		expect(resourceRepo.update).toHaveBeenCalledWith(
			resource.id,
			validUpdatePayload,
		);
	});

	test("can request community resources without the viewer's own listings", async () => {
		const service = new ResourceService();
		const resourceRepo = {
			getFilteredResources: mock(async () => []),
		};
		(service as any).resourceRepo = resourceRepo;

		await expect(
			service.getFilteredResources(
				{ filter: "All", excludeOwn: true, radiusMeters: 2000 },
				"owner-1",
			),
		).resolves.toEqual([]);

		expect(resourceRepo.getFilteredResources).toHaveBeenCalledWith(
			{ filter: "All", excludeOwn: true, radiusMeters: 2000 },
			{ excludeUserId: "owner-1" },
		);
	});

	test("rejects resource metadata updates from non-owners", async () => {
		const resource = buildResource({ userId: "owner-1" });
		const { service, resourceRepo } = createServiceForTransactions({
			resource,
		});

		await expect(
			service.updateResource(resource.id, "other-user", validUpdatePayload),
		).resolves.toBeNull();
		expect(resourceRepo.update).not.toHaveBeenCalled();
	});

	test("persists a borrow request notification for the lender", async () => {
		const resource = buildResource({ userId: "owner-1", name: "Generator" });
		const borrower = buildUser({ id: "borrower-1", name: "Mara" });
		const { service } = createServiceForTransactions({ resource, borrower });
		const notifySpy = spyOn(
			notificationService,
			"notifyResourceTransaction",
		).mockResolvedValue(undefined);

		await expect(
			service.requestBorrow({
				resourceId: resource.id,
				borrowerId: borrower.id,
			}),
		).resolves.toEqual({
			success: true,
			data: expect.objectContaining({
				borrowerId: borrower.id,
				lenderId: resource.userId,
				resourceId: resource.id,
				status: TransactionStatusEnum.Pending,
			}),
		});

		expect(notifySpy).toHaveBeenCalledWith({
			recipientUserId: resource.userId,
			action: "REQUESTED",
			transactionId: expect.any(String),
			resourceId: resource.id,
			resourceName: resource.name,
			borrowerId: borrower.id,
			borrowerName: borrower.name,
			lenderId: resource.userId,
			status: TransactionStatusEnum.Pending,
		});
	});

	test("requires Verified Neighbor status for item borrow requests", async () => {
		const resource = buildResource({
			userId: "owner-1",
			resourceType: "Item",
		});
		const borrower = buildUser({
			id: "borrower-1",
			isVerified: false,
			successfulInteractions: 2,
		});
		const { service, transactionRepo } = createServiceForTransactions({
			resource,
			borrower,
		});

		await expect(
			service.requestBorrow({
				resourceId: resource.id,
				borrowerId: borrower.id,
			}),
		).resolves.toEqual({
			success: false,
			error:
				"Verified Neighbor status is required to borrow community item listings. Complete three positively reviewed help interactions to unlock it.",
		});

		expect(transactionRepo.create).not.toHaveBeenCalled();
	});

	test("notifies the borrower when a request is accepted", async () => {
		const resource = buildResource({ userId: "owner-1", name: "Generator" });
		const transaction = buildTransaction({
			resourceId: resource.id,
			borrowerId: "borrower-1",
			lenderId: "owner-1",
			status: TransactionStatusEnum.Pending,
		});
		const { service, resourceRepo, transactionRepo } =
			createServiceForTransactions({
				resource,
				transaction,
				borrower: buildUser({ id: "borrower-1", name: "Mara" }),
			});
		const notifySpy = spyOn(
			notificationService,
			"notifyResourceTransaction",
		).mockResolvedValue(undefined);

		await expect(
			service.respondToRequest(transaction.id, true, "owner-1"),
		).resolves.toEqual({
			success: true,
			data: expect.objectContaining({
				status: TransactionStatusEnum.Active,
			}),
		});

		expect(resourceRepo.update).toHaveBeenCalledWith(resource.id, {
			availability: "Currently Unavailable",
		});
		expect(transactionRepo.cancelPendingByResourceId).toHaveBeenCalledWith(
			resource.id,
			transaction.id,
		);
		expect(notifySpy).toHaveBeenCalledWith({
			recipientUserId: "borrower-1",
			action: "ACCEPTED",
			transactionId: transaction.id,
			resourceId: resource.id,
			resourceName: resource.name,
			borrowerId: "borrower-1",
			borrowerName: "Mara",
			lenderId: "owner-1",
			status: TransactionStatusEnum.Active,
		});
	});

	test("notifies the borrower when a request is rejected", async () => {
		const resource = buildResource({ userId: "owner-1", name: "Generator" });
		const transaction = buildTransaction({
			resourceId: resource.id,
			borrowerId: "borrower-1",
			lenderId: "owner-1",
			status: TransactionStatusEnum.Pending,
		});
		const { service, resourceRepo } = createServiceForTransactions({
			resource,
			transaction,
			borrower: buildUser({ id: "borrower-1", name: "Mara" }),
		});
		const notifySpy = spyOn(
			notificationService,
			"notifyResourceTransaction",
		).mockResolvedValue(undefined);

		await expect(
			service.respondToRequest(transaction.id, false, "owner-1"),
		).resolves.toEqual({
			success: true,
			data: expect.objectContaining({
				status: TransactionStatusEnum.Cancelled,
			}),
		});

		expect(resourceRepo.update).not.toHaveBeenCalled();
		expect(notifySpy).toHaveBeenCalledWith({
			recipientUserId: "borrower-1",
			action: "REJECTED",
			transactionId: transaction.id,
			resourceId: resource.id,
			resourceName: resource.name,
			borrowerId: "borrower-1",
			borrowerName: "Mara",
			lenderId: "owner-1",
			status: TransactionStatusEnum.Cancelled,
		});
	});

	test("rejects request responses from users other than the resource owner", async () => {
		const { service, resourceRepo, transactionRepo } =
			createServiceForTransactions({
				transaction: buildTransaction({
					lenderId: "owner-1",
					status: TransactionStatusEnum.Pending,
				}),
			});

		await expect(
			service.respondToRequest(
				"22222222-2222-2222-2222-222222222222",
				true,
				"other-user",
			),
		).resolves.toEqual({
			success: false,
			error: "Only the resource owner can respond to this request",
		});
		expect(resourceRepo.update).not.toHaveBeenCalled();
		expect(transactionRepo.update).not.toHaveBeenCalled();
	});

	test("completes an active transaction and makes the resource available again", async () => {
		const resource = buildResource({
			availability: "Currently Unavailable",
		});
		const transaction = buildTransaction({
			resourceId: resource.id,
			borrowerId: "borrower-1",
			status: TransactionStatusEnum.Active,
		});
		const { service, resourceRepo, transactionRepo } =
			createServiceForTransactions({ resource, transaction });

		await expect(
			service.completeResourceTransaction(transaction.id, "borrower-1"),
		).resolves.toEqual({
			success: true,
			data: expect.objectContaining({
				status: TransactionStatusEnum.Completed,
			}),
		});

		expect(transactionRepo.update).toHaveBeenCalledWith(transaction.id, {
			status: TransactionStatusEnum.Completed,
			endAt: expect.any(Date),
		});
		expect(resourceRepo.update).toHaveBeenCalledWith(resource.id, {
			availability: "Available",
		});
	});

	test("rejects completion from users other than the borrower", async () => {
		const { service, resourceRepo, transactionRepo } =
			createServiceForTransactions({
				transaction: buildTransaction({
					borrowerId: "borrower-1",
					status: TransactionStatusEnum.Active,
				}),
			});

		await expect(
			service.completeResourceTransaction(
				"22222222-2222-2222-2222-222222222222",
				"other-user",
			),
		).resolves.toEqual({
			success: false,
			error: "Only the borrower can complete this transaction",
		});
		expect(resourceRepo.update).not.toHaveBeenCalled();
		expect(transactionRepo.update).not.toHaveBeenCalled();
	});

	test("prevents duplicate reviews for a completed transaction", async () => {
		const transaction = buildTransaction({
			status: TransactionStatusEnum.Completed,
		});
		const { service, reviewRepo } = createServiceForTransactions({
			transaction,
		});
		reviewRepo.getByTransactionId = mock(async () => buildReview());

		await expect(
			service.submitResourceReview(transaction.id, "borrower-1", {
				rating: 5,
				comment: "Great handoff",
			}),
		).resolves.toEqual({
			success: false,
			error: "This transaction has already been reviewed",
		});
		expect(reviewRepo.create).not.toHaveBeenCalled();
	});

	test("bumps owner trust score after every third successful action", async () => {
		const transaction = buildTransaction({
			status: TransactionStatusEnum.Completed,
		});
		const owner = buildUser({
			id: "owner-1",
			trustScore: 80,
			successfulInteractions: 2,
			isVerified: false,
		});
		const { service, userRepo } = createServiceForTransactions({
			transaction,
			owner,
		});

		await expect(
			service.submitResourceReview(transaction.id, "borrower-1", {
				rating: 5,
			}),
		).resolves.toEqual({
			success: true,
			data: expect.objectContaining({
				rating: 5,
				revieweeId: "owner-1",
			}),
		});

		expect(userRepo.update).toHaveBeenCalledWith("owner-1", {
			successfulInteractions: 3,
			isVerified: true,
			trustScore: 85,
		});
	});

	test("increments successful interactions after a positive review before verification", async () => {
		const transaction = buildTransaction({
			status: TransactionStatusEnum.Completed,
		});
		const owner = buildUser({
			id: "owner-1",
			trustScore: 65,
			successfulInteractions: 1,
			isVerified: false,
		});
		const { service, userRepo } = createServiceForTransactions({
			transaction,
			owner,
		});

		await service.submitResourceReview(transaction.id, "borrower-1", {
			rating: 5,
		});

		expect(userRepo.update).toHaveBeenCalledWith("owner-1", {
			successfulInteractions: 2,
		});
	});

	test("lowers owner trust score after every third failed action", async () => {
		const transaction = buildTransaction({
			status: TransactionStatusEnum.Completed,
		});
		const owner = buildUser({
			id: "owner-1",
			trustScore: 80,
			failedInteractions: 2,
		});
		const { service, userRepo } = createServiceForTransactions({
			transaction,
			owner,
		});

		await service.submitResourceReview(transaction.id, "borrower-1", {
			rating: 1,
		});

		expect(userRepo.update).toHaveBeenCalledWith("owner-1", {
			failedInteractions: 3,
			trustScore: 75,
		});
	});

	test("leaves owner trust score unchanged for neutral reviews", async () => {
		const transaction = buildTransaction({
			status: TransactionStatusEnum.Completed,
		});
		const owner = buildUser({
			id: "owner-1",
			trustScore: 80,
			successfulInteractions: 6,
		});
		const { service, userRepo } = createServiceForTransactions({
			transaction,
			owner,
		});

		await service.submitResourceReview(transaction.id, "borrower-1", {
			rating: 3,
		});

		expect(userRepo.update).not.toHaveBeenCalled();
	});
});
