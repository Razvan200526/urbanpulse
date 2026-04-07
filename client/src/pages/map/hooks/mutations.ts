import { hono, queryClient } from "@client/lib/api/client";
import { parseApiData } from "@client/lib/api/parse";
import { syncPulseInCache } from "@client/utils/pulseCache";
import { clientPulseSchema } from "@client/utils/types";
import { Toast } from "@heroui/react";
import type { PulseRequestType } from "@shared/validators/pulses/isPulseRequestValid";
import type { PulseUpdateBody } from "@shared/validators/pulses/isPulseUpdateValid";
import { useMutation } from "@tanstack/react-query";
import posthog from "posthog-js";
import { parsePulseMutationResponse, sendPulseSocketMessage } from "./shared";

type PulseResponseMutationInput = {
	pulseId: string;
	responseId: string;
};

type OfferHelpInput = {
	pulseId: string;
	note?: string;
};

type UploadPulseSocketMessage = Extract<
	Parameters<typeof sendPulseSocketMessage>[0],
	{ type: "upload-pulse" }
>;

type UpdatePulseInput = { pulseId: string } & PulseUpdateBody;

export const useCreatePulse = () => {
	return useMutation({
		mutationKey: ["pulse", "create"],
		mutationFn: async (pulseData: PulseRequestType) => {
			const response = await sendPulseSocketMessage(
				{
					type: "upload-pulse",
					payload: pulseData,
				} satisfies UploadPulseSocketMessage,
				clientPulseSchema,
				"Failed to create pulse",
			);

			syncPulseInCache(response.data);
			queryClient.invalidateQueries({ queryKey: ["pulse", "retrieve"] });
			Toast.toast.success("Pulse created successfully!");
			posthog.capture("pulse_created", {
				pulse_type: pulseData.type,
				urgency: pulseData.urgency,
			});

			return response;
		},
		onError: (error) => {
			Toast.toast.danger(
				error instanceof Error ? error.message : "Failed to create pulse.",
			);
		},
	});
};

export const useAcceptHelpOffer = () => {
	return useMutation({
		mutationKey: ["pulse", "accept-help"],
		mutationFn: async ({ pulseId, responseId }: PulseResponseMutationInput) => {
			const response = await hono.api.pulse[":id"].responses[
				":responseId"
			].accept.$post({
				param: { id: pulseId, responseId },
			});

			return parsePulseMutationResponse(response, "Could not accept offer");
		},
		onSuccess: (_, { pulseId, responseId }) => {
			queryClient.invalidateQueries({ queryKey: ["notifications"] });
			queryClient.invalidateQueries({ queryKey: ["pulse", "retrieve"] });
			posthog.capture("help_offer_accepted", {
				pulse_id: pulseId,
				response_id: responseId,
			});
		},
	});
};

export const useRejectHelpOffer = () => {
	return useMutation({
		mutationKey: ["pulse", "reject-help"],
		mutationFn: async ({ pulseId, responseId }: PulseResponseMutationInput) => {
			const response = await hono.api.pulse[":id"].responses[
				":responseId"
			].reject.$post({
				param: { id: pulseId, responseId },
			});

			return parsePulseMutationResponse(response, "Could not reject offer");
		},
		onSuccess: (_, { pulseId, responseId }) => {
			queryClient.invalidateQueries({ queryKey: ["notifications"] });
			queryClient.invalidateQueries({ queryKey: ["pulse", "retrieve"] });
			posthog.capture("help_offer_rejected", {
				pulse_id: pulseId,
				response_id: responseId,
			});
		},
	});
};

export const useOfferHelp = () => {
	return useMutation({
		mutationKey: ["pulse", "offer-help"],
		mutationFn: async ({ pulseId, note = "" }: OfferHelpInput) => {
			const response = await hono.api.pulse[":id"].responses.$post({
				param: { id: pulseId },
				json: { note },
			});

			return parsePulseMutationResponse(response, "Could not send offer");
		},
		onSuccess: (_, { pulseId }) => {
			queryClient.invalidateQueries({ queryKey: ["pulse", "retrieve"] });
			posthog.capture("help_offered", { pulse_id: pulseId });
		},
	});
};

export const useUpdatePulse = () => {
	return useMutation({
		mutationKey: ["pulse", "update"],
		mutationFn: async ({ pulseId, ...body }: UpdatePulseInput) => {
			const response = await hono.api.pulse[":id"].$patch({
				param: { id: pulseId },
				json: body,
			});
			const parsed = await parseApiData(
				response,
				clientPulseSchema,
				"Failed to update pulse",
			);

			return parsed.data;
		},
		onSuccess: (pulse) => {
			syncPulseInCache(pulse);
			queryClient.invalidateQueries({ queryKey: ["pulse", "retrieve"] });
		},
	});
};
