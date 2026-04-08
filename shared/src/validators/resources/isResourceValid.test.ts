import { describe, expect, test } from "bun:test";
import {
	isCreateResourceReqValid,
	isUpdateResourceReqValid,
} from "./isResourceValid";

const validPayload = {
	name: "Community ladder",
	description: "A tall ladder for nearby repair work",
	availability: "Available",
	resourceType: "Item",
	position: { x: 26.1, y: 44.4 },
	imageUrls: ["https://example.com/ladder.jpg"],
} as const;

describe("isCreateResourceReqValid", () => {
	test("accepts a complete resource payload without a client userId", () => {
		const result = isCreateResourceReqValid(validPayload);

		expect(result.success).toBe(true);
		expect(result.data).toEqual(validPayload);
	});

	test("rejects missing resource types", () => {
		const result = isCreateResourceReqValid({
			...validPayload,
			resourceType: undefined,
		});

		expect(result.success).toBe(false);
	});

	test("rejects unsupported resource types", () => {
		const result = isCreateResourceReqValid({
			...validPayload,
			resourceType: "Space",
		});

		expect(result.success).toBe(false);
	});

	test("rejects missing positions", () => {
		const result = isCreateResourceReqValid({
			...validPayload,
			position: undefined,
		});

		expect(result.success).toBe(false);
	});

	test("rejects coordinates outside valid longitude and latitude ranges", () => {
		expect(
			isCreateResourceReqValid({
				...validPayload,
				position: { x: 181, y: 44.4 },
			}).success,
		).toBe(false);
		expect(
			isCreateResourceReqValid({
				...validPayload,
				position: { x: 26.1, y: 91 },
			}).success,
		).toBe(false);
	});
});

describe("isUpdateResourceReqValid", () => {
	test("accepts editable resource fields without position", () => {
		const result = isUpdateResourceReqValid({
			name: "Community ladder",
			description: "A taller ladder for nearby repair work",
			availability: "Unavailable",
			resourceType: "Item",
			imageUrls: ["https://example.com/ladder.jpg"],
		});

		expect(result.success).toBe(true);
	});
});
