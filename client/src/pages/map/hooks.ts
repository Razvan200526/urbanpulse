// import { hono } from "@client/main";
// import type { PulseType } from "@server/db/schema";
// import { useMutation } from "@tanstack/react-query";
// import { useEffect, useRef, useState } from "react";
// import { Socket } from "client/sdk/Socket";

// export const useCreatePulse = (userId: string) => {
// 	return useMutation({
// 		mutationKey: ["pulse", userId],
// 		mutationFn: async (data: Partial<PulseType>) => {
// 			const socket = hono.api.pulse.ws.$ws({ query: data });
// 			return socket;
// 		},
// 	});
// };

// export const useGetPulses = (
// 	userId: string | undefined,
// 	coords: { lat: number; lng: number } | null,
// ) => {
// 	const [pulses, setPulses] = useState<PulseType[]>([]);
// 	const socketRef = useRef<Socket | null>(null);

// 	useEffect(() => {
// 		if (!userId || !coords) return;

// 		if (!socketRef.current) {
// 			const wsUrl = `${import.meta.env.VITE_SERVER_URL}/api/pulse/ws/${userId}`;
// 			socketRef.current = new Socket(wsUrl);

// 			socketRef.current.on("message", (response: any) => {
// 				if (response.success && Array.isArray(response.data)) {
// 					setPulses(response.data);
// 				}
// 			});
// 		}

// 		// Send coordinates to get nearby pulses
// 		socketRef.current.send({
// 			channelName: "get:pulses",
// 			data: {
// 				coords: {
// 					lat: coords.lat,
// 					lng: coords.lng,
// 				},
// 			},
// 		});

// 		return () => {
// 			// We might not want to close it every time coords change if it's too frequent,
// 			// but for now let's keep it simple or only close on unmount.
// 		};
// 	}, [userId]);

// 	useEffect(() => {
// 		return () => {
// 			socketRef.current?.close();
// 			socketRef.current = null;
// 		};
// 	}, []);

// 	return { pulses };
// };
