import { describe, expect, test } from "bun:test";
import { getAuthCookieAttributes } from "@server/services/auth/getAuthCookieAttributes";

describe("getAuthCookieAttributes", () => {
	test("uses lax cookies in development without partitioning", () => {
		const attributes = getAuthCookieAttributes("development");

		expect(attributes).toEqual({
			httpOnly: true,
			secure: false,
			sameSite: "lax",
		});
		expect(
			Object.prototype.hasOwnProperty.call(attributes, "partitioned"),
		).toBeFalse();
	});

	test("uses secure cross-site cookies in production without partitioning", () => {
		const attributes = getAuthCookieAttributes("production");

		expect(attributes).toEqual({
			httpOnly: true,
			secure: true,
			sameSite: "none",
		});
		expect(
			Object.prototype.hasOwnProperty.call(attributes, "partitioned"),
		).toBeFalse();
	});
});
