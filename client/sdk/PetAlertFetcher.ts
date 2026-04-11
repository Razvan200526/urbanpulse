import {
	type ClientPetAlert,
	type PetAlertCreatePayload,
	type PetAlertUploadAccepted,
	petAlertCreatePayloadSchema,
	petAlertEnvelopeSchema,
	petAlertListEnvelopeSchema,
	petAlertUploadAcceptedEnvelopeSchema,
	throwPetAlertApiError,
} from "@client/utils/petAlerts";
import type { ResponseType } from "@client/utils/types";
import { z } from "zod";
import type { Fetcher } from "./Fetcher";

const petAlertUpdatePayloadSchema = z
	.object({
		alertType: z.string().optional(),
		petType: z.string().optional(),
		color: z.string().optional(),
		breed: z.string().nullable().optional(),
		imageUrl: z.string().url().nullable().optional(),
		aiDescriptor: z.string().nullable().optional(),
	})
	.refine((value) => Object.keys(value).length > 0, {
		message: "At least one field is required.",
	});

type PetAlertUpdatePayload = z.infer<typeof petAlertUpdatePayloadSchema>;

export class PetAlertFetcher {
	constructor(readonly fetcher: Fetcher) {}

	public readonly create = async (
		payload: PetAlertCreatePayload,
	): Promise<ResponseType<PetAlertUploadAccepted> | null> => {
		const validatedPayload = petAlertCreatePayloadSchema.parse(payload);
		const raw = await this.fetcher.post("/api/v1/pet-alerts", validatedPayload);
		const parsed = petAlertUploadAcceptedEnvelopeSchema.safeParse(raw);
		return parsed.data ?? null;
	};

	public readonly get = async (
		userId: string,
		petAlertId: string,
	): Promise<ResponseType<ClientPetAlert> | null> => {
		const raw = await this.fetcher.get(
			`/api/v1/pet-alerts/${userId}/${petAlertId}`,
		);
		const parsed = petAlertEnvelopeSchema.safeParse(raw);
		if (!parsed.success) {
			throwPetAlertApiError(raw, "Failed to retrieve pet alert");
		}
		return parsed.data ?? null;
	};

	public readonly list = async (): Promise<ResponseType<ClientPetAlert[]>> => {
		const raw = await this.fetcher.get("/api/v1/pet-alerts");
		const parsed = petAlertListEnvelopeSchema.safeParse(raw);
		if (!parsed.success) {
			throwPetAlertApiError(raw, "Failed to list pet alerts");
		}
		return parsed?.data
			? parsed.data
			: { data: [], success: true, message: "" };
	};

	public readonly update = async (
		petAlertId: string,
		payload: PetAlertUpdatePayload,
	): Promise<ResponseType<ClientPetAlert> | null> => {
		const validatedPayload = petAlertUpdatePayloadSchema.parse(payload);
		const raw = await this.fetcher.patch(
			`/api/v1/pet-alerts/${petAlertId}`,
			validatedPayload,
		);
		const parsed = petAlertEnvelopeSchema.safeParse(raw);
		if (!parsed.success) {
			throwPetAlertApiError(raw, "Failed to update pet alert");
		}
		return parsed.data ?? null;
	};
}
