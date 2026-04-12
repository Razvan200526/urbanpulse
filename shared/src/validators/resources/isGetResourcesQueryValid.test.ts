import { describe, expect, test } from "bun:test";
import { isGetResourcesQueryValid } from "./isGetResourcesQueryValid";

describe("isGetResourcesQueryValid", () => {
	test("coerces numeric query values and applies the default radius", () => {
		const result = isGetResourcesQueryValid({
			filter: "Available",
			excludeOwn: "true",
			lat: "44.4",
			long: "26.1",
			type: "Location",
		});

		expect(result.success).toBe(true);
		expect(result.data).toEqual({
			filter: "Available",
			excludeOwn: true,
			lat: 44.4,
			long: 26.1,
			radiusMeters: 2000,
			type: "Location",
		});
	});

	test("rejects unsupported resource types", () => {
		const result = isGetResourcesQueryValid({
			filter: "All",
			type: "Space",
		});

		expect(result.success).toBe(false);
	});

	test("rejects partial coordinate filters", () => {
		expect(
			isGetResourcesQueryValid({
				filter: "All",
				lat: "44.4",
			}).success,
		).toBe(false);
		expect(
			isGetResourcesQueryValid({
				filter: "All",
				long: "26.1",
			}).success,
		).toBe(false);
	});

	test("rejects radius values outside the supported range", () => {
		expect(
			isGetResourcesQueryValid({
				filter: "All",
				lat: "44.4",
				long: "26.1",
				radiusMeters: "99",
			}).success,
		).toBe(false);
		expect(
			isGetResourcesQueryValid({
				filter: "All",
				lat: "44.4",
				long: "26.1",
				radiusMeters: "10001",
			}).success,
		).toBe(false);
	});
});
