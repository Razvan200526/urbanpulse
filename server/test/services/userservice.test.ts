import { afterEach, describe, expect, mock, spyOn, test } from "bun:test";
import type { UserType } from "@server/db/schema";
import { cacheManager } from "@server/services/cache/CacheManager";
import { UserService } from "@server/services/UserService";

function buildUser(overrides: Partial<UserType> = {}): UserType {
	return {
		id: "user-1",
		name: "User",
		email: "user@example.com",
		emailVerified: true,
		image: null,
		role: "user",
		rememberMe: null,
		bio: null,
		trustScore: 0,
		successfulInteractions: 0,
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

afterEach(() => {
	mock.restore();
});

describe("UserService", () => {
	test("updateAlertPreferences invalidates profile and hero alert caches", async () => {
		const service = new UserService();
		const invalidateSpy = spyOn(cacheManager, "invalidate").mockResolvedValue(
			undefined,
		);
		const invalidatePatternSpy = spyOn(
			cacheManager,
			"invalidatePattern",
		).mockResolvedValue(undefined);
		(service as any).userRepo = {
			update: mock(async () =>
				buildUser({
					homeLocation: { x: 26.1, y: 44.4 } as any,
					heroAlertRadiusMeters: 800,
				}),
			),
		};

		await expect(
			service.updateAlertPreferences("user-1", {
				homeLocation: { x: 26.1, y: 44.4 },
				heroAlertRadiusMeters: 800,
			}),
		).resolves.toEqual({
			homeLocation: { x: 26.1, y: 44.4 },
			lastKnownLocation: null,
			lastKnownLocationUpdatedAt: null,
			heroAlertRadiusMeters: 800,
		});

		expect(invalidateSpy).toHaveBeenCalledWith("user-1:profile", {
			namespace: "profile",
		});
		expect(invalidatePatternSpy).toHaveBeenCalledWith("*:matches", "heroAlert");
	});
});
