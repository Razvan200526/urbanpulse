import { describe, expect, test } from "bun:test";
import {
	getPulseResponseActionPayload,
	summarizeNotificationPayload,
} from "./notifications";

describe("notification helpers", () => {
	test("extracts pulse response action payload only when both ids exist", () => {
		expect(
			getPulseResponseActionPayload({
				pulseId: "pulse-1",
				responseId: "response-1",
			}),
		).toEqual({
			pulseId: "pulse-1",
			responseId: "response-1",
		});

		expect(
			getPulseResponseActionPayload({
				pulseId: "pulse-1",
			}),
		).toBeNull();

		expect(
			getPulseResponseActionPayload({
				pulseId: "pulse-1",
				responseId: "response-1",
				isActionable: false,
			}),
		).toBeNull();
	});

	test("summarizes pulse response notifications", () => {
		expect(
			summarizeNotificationPayload("PULSE_RESPONSE", {
				responderName: "Casey",
				pulseTitle: "Need groceries",
			}),
		).toContain("Casey offered help");

		expect(summarizeNotificationPayload("MESSAGE", null)).toBe("");
	});

	test("summarizes transaction notifications", () => {
		expect(
			summarizeNotificationPayload("TRANSACTION", {
				action: "REQUESTED",
				resourceName: "Generator",
				borrowerName: "Mara",
			}),
		).toBe("Mara requested “Generator”.");

		expect(
			summarizeNotificationPayload("TRANSACTION", {
				action: "ACCEPTED",
				resourceName: "Generator",
			}),
		).toBe("Your request for “Generator” was accepted.");

		expect(
			summarizeNotificationPayload("TRANSACTION", {
				action: "REJECTED",
				resourceName: "Generator",
			}),
		).toBe("Your request for “Generator” was rejected.");
	});
});
