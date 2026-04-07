import { describe, expect, test } from "bun:test";
import {
	getApiErrorMessage,
	normalizeResources,
	type ResourceWithUsersApiItem,
} from "./resourceResponses";

describe("resource response helpers", () => {
	test("normalizes resource dates into Date instances", () => {
		const items: ResourceWithUsersApiItem[] = [
			{
				resource: {
					id: "resource-1",
					userId: "user-1",
					name: "Ladder",
					description: "Tall ladder",
					availability: "Available",
					position: { x: 26.1, y: 44.4 },
					locationLabel: "Bucharest",
					resourceType: "Item",
					imageUrls: [],
					createdAt: "2025-01-01T00:00:00.000Z",
				},
				author: null,
				recentUsers: [],
				reviewSummary: { averageRating: 4.5, count: 2 },
			},
		];

		const [result] = normalizeResources(items);

		expect(result?.resource.createdAt).toBeInstanceOf(Date);
		expect(result?.reviewSummary).toEqual({ averageRating: 4.5, count: 2 });
	});

	test("prefers explicit error text when present", () => {
		expect(
			getApiErrorMessage(
				{ success: false, error: "Request failed" },
				"Fallback message",
			),
		).toBe("Request failed");
	});
});
