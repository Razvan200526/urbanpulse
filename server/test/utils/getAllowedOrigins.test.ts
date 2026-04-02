import { afterEach, describe, expect, test } from "bun:test";
import { getAllowedOrigins, getCorsOrigin } from "@server/utils/getAllowedOrigins";

const previousClientUrl = Bun.env.CLIENT_URL;
const previousServerUrl = Bun.env.SERVER_URL;

afterEach(() => {
	Bun.env.CLIENT_URL = previousClientUrl;
	Bun.env.SERVER_URL = previousServerUrl;
});

describe("getAllowedOrigins", () => {
	test("normalizes comma-separated origins and removes duplicates", () => {
		Bun.env.CLIENT_URL =
			"https://urbanpulse.pages.dev/, https://urbanpulse.com";
		Bun.env.SERVER_URL =
			"https://urbanpulse-production-3490.up.railway.app/, https://urbanpulse.com";

		expect(getAllowedOrigins()).toEqual([
			"https://urbanpulse.pages.dev",
			"https://urbanpulse.com",
			"https://urbanpulse-production-3490.up.railway.app",
		]);
	});

	test("returns the matched origin for CORS checks", () => {
		Bun.env.CLIENT_URL = "https://urbanpulse.pages.dev/";
		Bun.env.SERVER_URL = "https://urbanpulse-production-3490.up.railway.app/";

		expect(getCorsOrigin("https://urbanpulse.pages.dev")).toBe(
			"https://urbanpulse.pages.dev",
		);
		expect(getCorsOrigin("https://unknown.example")).toBe("");
	});
});
