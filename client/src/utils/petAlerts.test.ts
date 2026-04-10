import { describe, expect, test } from "bun:test";
import {
	PetAlertEmbeddingStatusEnum,
	PetAlertTypeEnum,
	PetAlertUploadStatusEnum,
} from "@shared/types";
import {
	petAlertUploadAcceptedEnvelopeSchema,
	petAlertUploadSocketDataSchema,
} from "./petAlerts";

const validAlert = {
	id: "11111111-1111-1111-8111-111111111111",
	pulseId: "22222222-2222-2222-8222-222222222222",
	alertType: PetAlertTypeEnum.Lost,
	petType: "dog",
	color: "golden",
	breed: "golden retriever",
	imageUrl: "https://example.com/dog.png",
	aiDescriptor: "golden dog, likely golden retriever-type",
	embeddingStatus: PetAlertEmbeddingStatusEnum.Ready,
	embeddingModel: "google/siglip2-base-patch16-224",
	embeddingUpdatedAt: "2026-04-10T10:00:00.000Z",
};

describe("pet alert schemas", () => {
	test("parses accepted upload envelopes", () => {
		const parsed = petAlertUploadAcceptedEnvelopeSchema.parse({
			success: true,
			message: "Pet alert upload accepted",
			data: {
				requestId: "33333333-3333-3333-8333-333333333333",
				alertId: validAlert.id,
				status: PetAlertUploadStatusEnum.Pending,
				embeddingStatus: PetAlertEmbeddingStatusEnum.Pending,
				alert: {
					...validAlert,
					embeddingStatus: PetAlertEmbeddingStatusEnum.Pending,
					embeddingModel: null,
					embeddingUpdatedAt: null,
				},
			},
		});

		expect(parsed.data.status).toBe(PetAlertUploadStatusEnum.Pending);
		expect(parsed.data.alert.alertType).toBe(PetAlertTypeEnum.Lost);
	});

	test("rejects malformed socket payloads", () => {
		const parsed = petAlertUploadSocketDataSchema.safeParse({
			requestId: "33333333-3333-3333-8333-333333333333",
			alertId: validAlert.id,
			status: "done",
			embeddingStatus: PetAlertEmbeddingStatusEnum.Ready,
			alert: validAlert,
		});

		expect(parsed.success).toBe(false);
	});
});
