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
					imageUrls: [],
					createdAt: "2025-01-01T00:00:00.000Z",
				},
				author: null,
				recentUsers: [],
			},
		];

		const [result] = normalizeResources(items);

		expect(result?.resource.createdAt).toBeInstanceOf(Date);
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
