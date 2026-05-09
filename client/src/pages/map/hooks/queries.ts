import { useNotificationSocketOpen } from "@client/hooks/notifications/useNotificationsFeed";
import { useCrisisStore } from "@client/stores/crisisStore";
import { calculateDistance } from "@shared/utils";
import type { PulseRetrievePayloadType } from "@shared/validators/pulses/isPulseRetrieveValid";
import { useQuery } from "@tanstack/react-query";
import { backend } from "client/sdk/backend";
import { useEffect } from "react";
import {
	fetchClusters,
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

export const useRetrieveClusters = (
	data: { lat: number; lng: number; radius: number },
	enabled = true,
) => {
	const setActiveCrises = useCrisisStore((state) => state.setActiveCrises);
	const query = useQuery({
		queryKey: ["pulse", "clusters", data],
		enabled,
		queryFn: async () => {
			try {
				return await fetchClusters(data);
			} catch (err) {
				// biome-ignore lint/suspicious/noConsole: debugging
				console.error("useRetrieveClusters Error:", err);
				throw err;
			}
		},
		refetchInterval: enabled ? 30000 : false,
		refetchIntervalInBackground: true,
	});

	useEffect(() => {
		if (query.data) {
			const nearbyCrises = query.data.filter((cluster) => {
				if (cluster.status !== "crisis") return false;

				const distance = calculateDistance(
					{ lat: data.lat, lng: data.lng },
					{ lat: cluster.centerLat, lng: cluster.centerLng },
				);
				const effectiveRadius = Math.max(data.radius, cluster.radiusMeters);

				// biome-ignore lint/suspicious/noConsole: debugging proximity
				console.log(
					`Cluster ${cluster.id} distance: ${distance}m (Effective radius: ${effectiveRadius}m)`,
				);

				return distance <= effectiveRadius;
			});
			setActiveCrises(nearbyCrises);
		}
	}, [query.data, data.lat, data.lng, data.radius, setActiveCrises]);

	return query;
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
