import type { PulseRetrievePayloadType } from "@shared/validators/pulses/isPulseRetrieveValid";
import { useQuery } from "@tanstack/react-query";
import { backend } from "client/sdk/backend";
import { useEffect } from "react";
import {
	fetchPulseById,
	parsePulseNotification,
	pulseArraySchema,
	sendPulseSocketMessage,
	syncPulseInCache,
} from "./shared";

export const useRetrievePulseById = (
	pulseId: string | null | undefined,
	enabled = true,
) => {
	return useQuery({
		queryKey: ["pulse", "detail", pulseId],
		enabled: Boolean(pulseId) && enabled,
		queryFn: () => fetchPulseById(pulseId as string),
		refetchInterval: enabled ? 3000 : false,
		refetchIntervalInBackground: true,
	});
};

export const useRetrieveMapPulses = (
	data: PulseRetrievePayloadType,
	enabled = true,
) => {
	const query = useQuery({
		queryKey: ["pulse", "map", data],
		enabled,
		queryFn: () =>
			sendPulseSocketMessage(
				{
					type: "get-map-pulses",
					payload: data,
				},
				pulseArraySchema,
				"Failed to retrieve map pulses",
			).then((result) => result.data),
		refetchInterval: enabled ? 3000 : false,
		refetchIntervalInBackground: true,
	});

	useEffect(() => {
		if (!enabled) {
			return;
		}

		const unsubscribe = backend.notifications.on<unknown>(
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

				const parsed = parsePulseNotification(response.data);

				if (!parsed.payload.pulse) {
					return;
				}

				syncPulseInCache(parsed.payload.pulse);
			},
		);

		return unsubscribe;
	}, [enabled]);

	return query;
};

export const useRetrievePulses = (
	data: PulseRetrievePayloadType,
	enabled = true,
) => {
	return useQuery({
		queryKey: ["pulse", "retrieve", data],
		enabled,
		queryFn: () =>
			sendPulseSocketMessage(
				{
					type: "get-pulses",
					payload: data,
				},
				pulseArraySchema,
				"Failed to retrieve pulses",
			),
		refetchInterval: enabled ? 3000 : false,
		refetchIntervalInBackground: true,
	});
};
