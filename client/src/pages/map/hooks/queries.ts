import { useNotificationSocketOpen } from "@client/hooks/notifications/useNotificationsFeed";
import type { PulseRetrievePayloadType } from "@shared/validators/pulses/isPulseRetrieveValid";
import { useQuery } from "@tanstack/react-query";
import { backend } from "client/sdk/backend";
import { useEffect } from "react";
import {
	fetchPulseById,
	pulseArraySchema,
	sendPulseSocketMessage,
} from "./shared";

const useSyncNotificationSocketLocation = (
	data: PulseRetrievePayloadType,
	enabled: boolean,
) => {
	const { x, y } = data.position;

	useEffect(() => {
		if (!enabled) {
			return;
		}

		backend.notifications.send({
			type: "UPDATE_LOCATION",
			location: { x, y },
		});
	}, [x, y, enabled]);
};

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
	const isNotificationSocketOpen = useNotificationSocketOpen();
	useSyncNotificationSocketLocation(data, enabled);

	return useQuery({
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
		refetchInterval: enabled && !isNotificationSocketOpen ? 3000 : false,
		refetchIntervalInBackground: true,
	});
};

export const useRetrievePulses = (
	data: PulseRetrievePayloadType,
	enabled = true,
) => {
	const isNotificationSocketOpen = useNotificationSocketOpen();
	useSyncNotificationSocketLocation(data, enabled);

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
		refetchInterval: enabled && !isNotificationSocketOpen ? 3000 : false,
		refetchIntervalInBackground: true,
	});
};
