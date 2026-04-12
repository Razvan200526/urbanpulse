import { hono, queryClient } from "@client/lib/api/client";
import { syncPulseInCache } from "@client/utils/pulseCache";
import { clientPulseSchema } from "@client/utils/types";
import { Toast } from "@heroui/react";
import type { PulseRequestType } from "@shared/validators/pulses/isPulseRequestValid";
import type { PulseUpdateBody } from "@shared/validators/pulses/isPulseUpdateValid";
import { useMutation } from "@tanstack/react-query";
import posthog from "posthog-js";
import { sendPulseSocketMessage } from "./shared";

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
			try {
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
			} catch (error) {
				Toast.toast.danger(
					error instanceof Error ? error.message : "Failed to create pulse.",
				);
				return null;
			}
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

			const res = await response.json();
			if (!res.success) {
				Toast.toast.danger(res.message || "Failed to accept help offer");
				return null;
			}
			return res.data;
		},
		onSuccess: (data, { pulseId, responseId }) => {
			if (data) {
				queryClient.invalidateQueries({ queryKey: ["notifications"] });
				queryClient.invalidateQueries({ queryKey: ["pulse", "retrieve"] });
				posthog.capture("help_offer_accepted", {
					pulse_id: pulseId,
					response_id: responseId,
				});
			}
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

			const res = await response.json();
			if (!res.success) {
				Toast.toast.danger(res.message || "Failed to reject help offer");
				return null;
			}
			return res.data;
		},
		onSuccess: (data, { pulseId, responseId }) => {
			if (data) {
				queryClient.invalidateQueries({ queryKey: ["notifications"] });
				queryClient.invalidateQueries({ queryKey: ["pulse", "retrieve"] });
				posthog.capture("help_offer_rejected", {
					pulse_id: pulseId,
					response_id: responseId,
				});
			}
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

			const res = await response.json();
			if (!res.success) {
				Toast.toast.danger(res.message || "Could not send offer");
				return null;
			}
			Toast.toast.success(res.message || "Offer sent successfully");
			return res.data;
		},
		onSuccess: (data, { pulseId }) => {
			if (data) {
				queryClient.invalidateQueries({ queryKey: ["pulse", "retrieve"] });
				posthog.capture("help_offered", { pulse_id: pulseId });
			}
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

			const res = await response.json();
			if (!res.success) {
				Toast.toast.danger(res.message || "Failed to update pulse");
				return null;
			}
			Toast.toast.success(res.message || "Pulse updated successfully");
			return res.data;
		},
		onSuccess: (pulse) => {
			if (pulse) {
				syncPulseInCache(pulse);
				queryClient.invalidateQueries({ queryKey: ["pulse", "retrieve"] });
			}
		},
	});
};
