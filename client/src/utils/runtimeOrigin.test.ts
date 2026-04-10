import { describe, expect, test } from "bun:test";
import {
	resolveAiOrigin,
	resolveApiOrigin,
	resolveAppOrigin,
	toWebSocketUrl,
} from "./runtimeOrigin";

describe("runtime origin helpers", () => {
	test("prefers the browser origin for app URLs and normalizes slashes", () => {
		expect(
			resolveAppOrigin({
				appOrigin: "https://urbanpulse.pages.dev/",
				browserOrigin: "https://urbanpulse.pages.dev/",
				serverOrigin: "https://urbanpulse-production.up.railway.app/",
			}),
		).toBe("https://urbanpulse.pages.dev");
	});

	test("uses the app origin for API calls when the edge proxy is enabled", () => {
		expect(
			resolveApiOrigin({
				appOrigin: "https://urbanpulse.pages.dev/",
				edgeProxyEnabled: true,
				serverOrigin: "https://urbanpulse-production.up.railway.app/",
			}),
		).toBe("https://urbanpulse.pages.dev");
	});

	test("keeps direct server access when the edge proxy is disabled", () => {
		expect(
			resolveApiOrigin({
				appOrigin: "https://urbanpulse.pages.dev/",
				edgeProxyEnabled: false,
				serverOrigin: "https://urbanpulse-production.up.railway.app/",
			}),
		).toBe("https://urbanpulse-production.up.railway.app");
	});

	test("converts API URLs into websocket URLs", () => {
		expect(
			toWebSocketUrl("https://urbanpulse.pages.dev/api/notifications/ws"),
		).toBe("wss://urbanpulse.pages.dev/api/notifications/ws");
	});

	test("resolves the AI origin independently from the main API origin", () => {
		expect(
			resolveAiOrigin({
				appOrigin: "https://urbanpulse.pages.dev/",
				serverOrigin: "https://ai.urbanpulse.dev/",
			}),
		).toBe("https://ai.urbanpulse.dev");
	});
});
