import { hono, queryClient } from "@client/main";
import { Toast } from "@heroui/react";
import type { PulseType } from "@server/db/schema";
import type { PulseRequestType } from "@shared/validators/pulses/isPulseRequestValid";
import type { PulseRetrievePayloadType } from "@shared/validators/pulses/isPulseRetrieveValid";
import type { PulseSocketMessageType } from "@shared/validators/pulses/isPulseSocketMessageValid";
import type { PulseUpdateBody } from "@shared/validators/pulses/isPulseUpdateValid";
import { useMutation, useQuery } from "@tanstack/react-query";
import posthog from "posthog-js";

type PulseSocketResponse<T> = {
	success: boolean;
	message: string;
	data: T;
};

type UploadPulseSocketMessage = Extract<
	PulseSocketMessageType,
	{ type: "upload-pulse" }
>;

type PulseResponseMutationInput = {
	pulseId: string;
	responseId: string;
};

type PulseResponseMutationResult = {
	success: boolean;
	message?: string;
};

const sendPulseSocketMessage = <T>(message: PulseSocketMessageType) => {
	return new Promise<PulseSocketResponse<T>>((resolve, reject) => {
		const socket = hono.api.pulse.$ws();

		const cleanup = () => {
			socket.removeEventListener("open", onOpen);
			socket.removeEventListener("message", onMessage);
			socket.removeEventListener("error", onError);
			socket.close();
		};

		const onOpen = () => {
			socket.send(JSON.stringify(message));
		};

		const onMessage = (event: MessageEvent) => {
			try {
				const parsed = JSON.parse(event.data) as PulseSocketResponse<T>;
				cleanup();
				resolve(parsed);
			} catch (error) {
				cleanup();
				reject(error);
			}
		};

		const onError = () => {
			cleanup();
			reject(new Error("WebSocket error"));
		};

		socket.addEventListener("open", onOpen);
		socket.addEventListener("message", onMessage);
		socket.addEventListener("error", onError);
	});
};

export const useCreatePulse = () => {
	return useMutation({
		mutationKey: ["pulse", "create"],
		mutationFn: (pulseData: PulseRequestType) => {
			return sendPulseSocketMessage<PulseType>({
				type: "upload-pulse",
				payload: pulseData,
			} satisfies UploadPulseSocketMessage).then((response) => {
				if (!response.success) {
					Toast.toast.danger(response.message || "Failed to create pulse.");
					throw new Error(response.message || "Failed to create pulse");
				}

				queryClient.invalidateQueries({ queryKey: ["pulse", "retrieve"] });
				Toast.toast.success("Pulse created successfully!");
				posthog.capture("pulse_created", {
					pulse_type: pulseData.type,
					urgency: pulseData.urgency,
				});
				return response;
			});
		},
	});
};

export const useAcceptHelpOffer = () => {
	return useMutation({
		mutationKey: ["pulse", "accept-help"],
		mutationFn: async ({ pulseId, responseId }: PulseResponseMutationInput) => {
			const res = await hono.api.pulse[":id"].responses[
				":responseId"
			].accept.$post({
				param: { id: pulseId, responseId },
			});
			const data = (await res.json()) as PulseResponseMutationResult;
			if (!data.success) {
				throw new Error(data.message || "Could not accept offer");
			}
			return data;
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
			const res = await hono.api.pulse[":id"].responses[
				":responseId"
			].reject.$post({
				param: { id: pulseId, responseId },
			});
			const data = (await res.json()) as PulseResponseMutationResult;
			if (!data.success) {
				throw new Error(data.message || "Could not reject offer");
			}
			return data;
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
		mutationFn: async ({
			pulseId,
			note = "",
		}: {
			pulseId: string;
			note?: string;
		}) => {
			const res = await hono.api.pulse[":id"].responses.$post({
				param: { id: pulseId },
				json: { note },
			});
			const data = (await res.json()) as {
				success: boolean;
				message?: string;
			};
			if (!data.success) {
				throw new Error(data.message || "Could not send offer");
			}
			return data;
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
		mutationFn: async ({
			pulseId,
			...body
		}: { pulseId: string } & PulseUpdateBody) => {
			const res = await hono.api.pulse[":id"].$patch({
				param: { id: pulseId },
				json: body,
			});
			const data = await res.json();
			if (!data.success) {
				throw new Error(data.message || "Failed to update pulse");
			}
			return data.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["pulse", "retrieve"] });
		},
	});
};

export const useRetrievePulses = (
	data: PulseRetrievePayloadType,
	enabled = true,
) => {
	return useQuery<PulseSocketResponse<PulseType[]>>({
		queryKey: ["pulse", "retrieve", data],
		enabled,
		queryFn: () => {
			return sendPulseSocketMessage<PulseType[]>({
				type: "get-pulses",
				payload: data,
			}).then((response) => {
				if (!response.success) {
					throw new Error(response.message || "Failed to retrieve pulses");
				}

				return response;
			});
		},
	});
};
