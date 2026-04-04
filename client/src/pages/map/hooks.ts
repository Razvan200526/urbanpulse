import { hono, queryClient } from "@client/main";
import type {
	HeroAlertNotificationPayload,
	PulseUpdatedNotificationPayload,
} from "@client/utils/notifications";
import type { ClientPulseType } from "@client/utils/types";
import { Toast } from "@heroui/react";
import { PulseStatusEnum } from "@shared/types";
import type { PulseRequestType } from "@shared/validators/pulses/isPulseRequestValid";
import type { PulseRetrievePayloadType } from "@shared/validators/pulses/isPulseRetrieveValid";
import type { PulseSocketMessageType } from "@shared/validators/pulses/isPulseSocketMessageValid";
import type { PulseUpdateBody } from "@shared/validators/pulses/isPulseUpdateValid";
import { useMutation, useQuery } from "@tanstack/react-query";
import { backend } from "client/sdk/backend";
import posthog from "posthog-js";
import { useEffect } from "react";

type PulseSocketResponse<T> = {
	success: boolean;
	message: string;
	data: T;
};

type UploadPulseSocketMessage = Extract<
	PulseSocketMessageType,
	{ type: "upload-pulse" }
>;

type PulseDetailResponse = {
	success: boolean;
	message: string;
	data: ClientPulseType | null;
};

type PulseResponseMutationInput = {
	pulseId: string;
	responseId: string;
};

type PulseResponseMutationResult = {
	success: boolean;
	message?: string;
};

type NotificationSocketData = {
	type: string;
	payload: HeroAlertNotificationPayload | PulseUpdatedNotificationPayload;
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
		mutationFn: async (pulseData: PulseRequestType) => {
			const response = await sendPulseSocketMessage<ClientPulseType>({
				type: "upload-pulse",
				payload: pulseData,
			} satisfies UploadPulseSocketMessage);

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
		},
	});
};

export const useRetrievePulseById = (
	pulseId: string | null | undefined,
	enabled = true,
) => {
	return useQuery<ClientPulseType>({
		queryKey: ["pulse", "detail", pulseId],
		enabled: Boolean(pulseId) && enabled,
		queryFn: async () => {
			const res = await hono.api.pulse[":id"].$get({
				param: { id: pulseId as string },
			});
			const data = (await res.json()) as PulseDetailResponse;
			if (!data.success || !data.data) {
				throw new Error(data.message || "Failed to retrieve pulse");
			}
			return data.data;
		},
	});
};

const upsertMapPulse = (
	oldPulses: ClientPulseType[] | undefined,
	pulse: ClientPulseType,
) => {
	const next = new Map((oldPulses ?? []).map((entry) => [entry.id, entry]));

	if (pulse.status !== PulseStatusEnum.Active || pulse.mergedIntoPulseId) {
		next.delete(pulse.id);
		return Array.from(next.values());
	}

	next.set(pulse.id, pulse);
	return Array.from(next.values());
};

const syncPulseInCache = (pulse: ClientPulseType) => {
	queryClient.setQueryData<ClientPulseType>(
		["pulse", "detail", pulse.id],
		pulse,
	);
	queryClient.setQueriesData<ClientPulseType[]>(
		{ queryKey: ["pulse", "map"] },
		(oldPulses) => upsertMapPulse(oldPulses, pulse),
	);
};

export const useRetrieveMapPulses = (
	data: PulseRetrievePayloadType,
	enabled = true,
) => {
	const query = useQuery<ClientPulseType[]>({
		queryKey: ["pulse", "map", data],
		enabled,
		queryFn: async () => {
			const response = await sendPulseSocketMessage<ClientPulseType[]>({
				type: "get-map-pulses",
				payload: data,
			});

			if (!response.success) {
				throw new Error(response.message || "Failed to retrieve map pulses");
			}

			return response.data;
		},
	});

	useEffect(() => {
		if (!enabled) {
			return;
		}

		const unsubscribe = backend.notifications.on<NotificationSocketData>(
			"message",
			(response) => {
				if (!response.success) {
					return;
				}

				if (
					response.channelName !== "notifications:broadcast" &&
					response.channelName !== "notifications:pulse_updated"
				) {
					return;
				}

				const pulse =
					response.data.payload &&
					typeof response.data.payload === "object" &&
					"pulse" in response.data.payload
						? (response.data.payload.pulse as ClientPulseType | undefined)
						: undefined;

				if (!pulse) {
					return;
				}

				syncPulseInCache(pulse);
			},
		);

		return unsubscribe;
	}, [enabled]);

	return query;
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
			const data = await res.json();
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
			const data = (await res.json()) as {
				success: boolean;
				message?: string;
				data: ClientPulseType;
			};
			if (!data.success) {
				throw new Error(data.message || "Failed to update pulse");
			}
			return data.data;
		},
		onSuccess: (pulse) => {
			syncPulseInCache(pulse);
			queryClient.invalidateQueries({ queryKey: ["pulse", "retrieve"] });
		},
	});
};

export const useRetrievePulses = (
	data: PulseRetrievePayloadType,
	enabled = true,
) => {
	return useQuery<PulseSocketResponse<ClientPulseType[]>>({
		queryKey: ["pulse", "retrieve", data],
		enabled,
		queryFn: async () => {
			const response = await sendPulseSocketMessage<ClientPulseType[]>({
				type: "get-pulses",
				payload: data,
			});

			if (!response.success) {
				throw new Error(response.message || "Failed to retrieve pulses");
			}

			return response;
		},
	});
};
