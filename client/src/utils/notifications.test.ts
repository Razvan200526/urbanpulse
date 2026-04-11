import { describe, expect, test } from "bun:test";
import {
	PetAlertEmbeddingStatusEnum,
	PetAlertTypeEnum,
	PetMatchStatusEnum,
} from "@shared/types";
import {
	getPetMatchNotificationPayload,
	getPulseResponseActionPayload,
	isActionableNotification,
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

	test("parses pet match notifications and flags actionable states", () => {
		const payload = {
			petMatchId: "11111111-1111-1111-8111-111111111111",
			status: PetMatchStatusEnum.PendingReview,
			confidenceScore: 0.91,
			imageSimilarity: 0.88,
			matchedAttributes: ["color", "breed"],
			baseAlert: {
				id: "22222222-2222-2222-8222-222222222222",
				pulseId: "33333333-3333-3333-8333-333333333333",
				alertType: PetAlertTypeEnum.Lost,
				petType: "dog",
				color: "golden",
				breed: "retriever",
				imageUrl: "https://example.com/lost-dog.png",
				aiDescriptor: "golden retriever",
				embeddingStatus: PetAlertEmbeddingStatusEnum.Ready,
				embeddingModel: "siglip",
				embeddingUpdatedAt: "2026-04-11T08:00:00.000Z",
				ownerUserId: "user-1",
			},
			matchedAlert: {
				id: "44444444-4444-4444-8444-444444444444",
				pulseId: "55555555-5555-5555-8555-555555555555",
				alertType: PetAlertTypeEnum.Found,
				petType: "dog",
				color: "golden",
				breed: "retriever",
				imageUrl: "https://example.com/found-dog.png",
				aiDescriptor: "golden retriever",
				embeddingStatus: PetAlertEmbeddingStatusEnum.Ready,
				embeddingModel: "siglip",
				embeddingUpdatedAt: "2026-04-11T08:05:00.000Z",
				ownerUserId: "user-2",
			},
			counterpartUser: {
				id: "user-2",
				name: "Mara",
				image: null,
				email: "mara@example.com",
			},
			conversationId: null,
		};

		expect(getPetMatchNotificationPayload("PET_ALERT_MATCH", payload)).toEqual(
			expect.objectContaining({
				petMatchId: payload.petMatchId,
				status: PetMatchStatusEnum.PendingReview,
			}),
		);
		expect(isActionableNotification("PET_ALERT_MATCH", payload)).toBe(true);
		expect(summarizeNotificationPayload("PET_ALERT_MATCH", payload)).toContain(
			"Mara reported a possible match",
		);
	});
});
