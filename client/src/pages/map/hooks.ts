import { hono, queryClient } from "@client/main";
import { Toast } from "@heroui/react";
import type { PulseType } from "@server/db/schema";
import type { PulseRetrievePayloadType } from "@shared/validators/pulses/isPulseRetrieveValid";
import type { PulseUpdateBody } from "@shared/validators/pulses/isPulseUpdateValid";
import { useMutation, useQuery } from "@tanstack/react-query";

export const useCreatePulse = () => {
	return useMutation({
		mutationKey: ["pulse", "create"],
		mutationFn: (pulseData: Partial<PulseType>) => {
			return new Promise((resolve, reject) => {
				const socket = hono.api.pulse.$ws();

				const onOpen = () => {
					socket.send(JSON.stringify(pulseData));
				};

				const onMessage = (event: MessageEvent) => {
					try {
						const parsed = JSON.parse(event.data);
						socket.close();

						queryClient.invalidateQueries({ queryKey: ["pulse", "retrieve"] });
						Toast.toast.success("Pulse created successfully!");
						resolve(parsed);
					} catch (e) {
						Toast.toast.danger("Failed to create pulse. Try again later.");
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

export const useAcceptHelpOffer = () => {
	return useMutation({
		mutationKey: ["pulse", "accept-help"],
		mutationFn: async ({
			pulseId,
			responseId,
		}: {
			pulseId: string;
			responseId: string;
		}) => {
			const res = await hono.api.pulse[":id"].responses[
				":responseId"
			].accept.$post({
				param: { id: pulseId, responseId },
			});
			const data = (await res.json()) as {
				success: boolean;
				message?: string;
			};
			if (!data.success) {
				throw new Error(data.message || "Could not accept offer");
			}
			return data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["notifications"] });
			queryClient.invalidateQueries({ queryKey: ["pulse", "retrieve"] });
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
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["pulse", "retrieve"] });
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
	return useQuery<{ data: PulseType[] }>({
		queryKey: ["pulse", "retrieve", data],
		enabled,
		queryFn: () => {
			return new Promise((resolve, reject) => {
				const socket = hono.api.pulse.retrieve.$ws();

				const onOpen = () => {
					socket.send(JSON.stringify(data));
				};

				const onMessage = (event: MessageEvent) => {
					try {
						const parsed = JSON.parse(event.data);
						socket.close();
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
