import { hono, queryClient } from "@client/main";
import type { PulseType } from "@server/db/schema";
import type { PulseRetrievePayloadType } from "@shared/validators/pulses/isPulseRetrieveValid";
import { useMutation, useQuery } from "@tanstack/react-query";

export const useCreatePulse = () => {
	return useMutation({
		mutationKey: ["pulse", "create"],
		mutationFn: (pulseData: any) => {
			return new Promise((resolve, reject) => {
				const socket = hono.api.pulse.$ws();

				const onOpen = () => {
					socket.send(JSON.stringify(pulseData));
				};

				const onMessage = (event: MessageEvent) => {
					try {
						const parsed = JSON.parse(event.data);
						socket.close(); // Close connection after receiving data

						// Invalidate queries so the map updates
						queryClient.invalidateQueries({ queryKey: ["pulse", "retrieve"] });
						resolve(parsed);
					} catch (e) {
						reject(e);
					}
				};

				const onError = () => {
					socket.close();
					reject(new Error("WebSocket error"));
				};

				socket.addEventListener("open", onOpen);
				socket.addEventListener("message", onMessage);
				socket.addEventListener("error", onError);
			});
		},
	});
};

export const useRetrievePulses = (data: PulseRetrievePayloadType) => {
	return useQuery<{ data: PulseType[] }>({
		queryKey: ["pulse", "retrieve", data], // Consistent key naming
		queryFn: () => {
			return new Promise((resolve, reject) => {
				const socket = hono.api.pulse.retrieve.$ws();

				const onOpen = () => {
					socket.send(JSON.stringify(data));
				};

				const onMessage = (event: MessageEvent) => {
					try {
						const parsed = JSON.parse(event.data);
						socket.close(); // Close connection after receiving data
						resolve(parsed);
					} catch (e) {
						reject(e);
					}
				};

				const onError = () => {
					socket.close();
					reject(new Error("WebSocket error"));
				};

				socket.addEventListener("open", onOpen);
				socket.addEventListener("message", onMessage);
				socket.addEventListener("error", onError);

				return () => {
					socket.removeEventListener("open", onOpen);
					socket.removeEventListener("message", onMessage);
					socket.removeEventListener("error", onError);
					socket.close();
				};
			});
		},
	});
};
