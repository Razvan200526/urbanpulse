import { hono, queryClient } from "@client/main";
import { Toast } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef } from "react";
import type { GeolocationCoords } from "./useGetGeolocation";
import { useGetGeolocation } from "./useGetGeolocation";

export const useNotificationHook = (userId: string | undefined) => {
	const geoOptions = useMemo(() => ({ enableHighAccuracy: true }), []);
	const { coords } = useGetGeolocation(geoOptions, true);
	const socketRef = useRef<WebSocket | null>(null);
	const latestCoordsRef = useRef<GeolocationCoords | null>(null);

	const query = useQuery({
		queryKey: ["notifications", userId],
		enabled: !!userId,
		queryFn: async () => {
			const res = await hono.api.notifications.$get();
			const data = await res.json();
			if (!data.success) throw new Error(data.message);
			return data.data;
		},
	});

	// Open socket only when userId changes; send initial location from ref
	useEffect(() => {
		if (!userId) return;

		const socket = hono.api.notifications.ws.$ws();
		socketRef.current = socket;

		const handleOpen = () => {
			const c = latestCoordsRef.current;
			console.log(c);
			if (c && socket.readyState === WebSocket.OPEN) {
				console.log("Notification WS: Syncing Location", c);
				socket.send(
					JSON.stringify({
						type: "UPDATE_LOCATION",
						location: { x: c.long, y: c.lat }, // x = longitude, y = latitude
					}),
				);
			}
		};

		if (socket.readyState === WebSocket.OPEN) {
			handleOpen();
		} else {
			socket.addEventListener("open", handleOpen);
		}

		socket.onmessage = (event) => {
			try {
				const response = JSON.parse(event.data);
				if (
					response.success &&
					response.channelName === "notifications:broadcast"
				) {
					queryClient.invalidateQueries({
						queryKey: ["pulse", "retrieve"],
					});
					queryClient.setQueryData(["notifications", userId], (old: any) => {
						const newNotif = {
							id: crypto.randomUUID(),
							userId,
							type: response.data.type,
							payload: response.data.payload,
							read: false,
							createdAt: new Date().toISOString(),
						};
						return old ? [newNotif, ...old] : [newNotif];
					});
					Toast.toast.success(`${response.message}`);
				}
			} catch (e) {
				console.error("WS Message Error", e);
			}
		};

		return () => {
			socket.removeEventListener("open", handleOpen);
			socket.close();
			socketRef.current = null;
		};
	}, [userId]);

	useEffect(() => {
		latestCoordsRef.current = coords ?? null;

		if (socketRef.current?.readyState === WebSocket.OPEN && coords) {
			socketRef.current.send(
				JSON.stringify({
					type: "UPDATE_LOCATION",
					location: { x: coords.long, y: coords.lat },
				}),
			);
		}
	}, [coords]);

	return query;
};
