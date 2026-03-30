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
});
