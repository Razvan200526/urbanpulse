import { hono, queryClient } from "@client/lib/api/client";
import {
	type PetAlertCreatePayload,
	type PetAlertUploadSocketData,
	petAlertUploadSocketDataSchema,
} from "@client/utils/petAlerts";
import { Toast } from "@heroui/react";
import { PulseStatusEnum } from "@shared/types";
import { useMutation, useQuery } from "@tanstack/react-query";
import { backend } from "client/sdk/backend";
import { useEffect, useEffectEvent, useState } from "react";

type UsePetAlertSocketProps = {
	userId: string;
	onUploadMessage?: (payload: PetAlertUploadSocketData) => void | Promise<void>;
};

export const useGetPetAlerts = () => {
	return useQuery({
		queryKey: ["pet-alerts", "list"],
		queryFn: async () => {
			const response = await backend.petAlerts.list();
			if (!response.success) {
				Toast.toast.danger(response.message);
			}
			return response.data;
		},
	});
};

export const useCreatePetAlert = () => {
	return useMutation({
		mutationKey: ["pet-alert", "create"],
		mutationFn: async (payload: PetAlertCreatePayload) => {
			const response = await backend.petAlerts.create(payload);
			if (!response) {
				throw new Error("Error creating alert. Try again later!");
			}

			return response.data;
		},
	});
};

export const usePetAlertSocket = ({
	userId,
	onUploadMessage,
}: UsePetAlertSocketProps) => {
	const [socketConnected, setSocketConnected] = useState(false);
	const handleUploadMessage = useEffectEvent(
		async (payload: PetAlertUploadSocketData) => {
			await onUploadMessage?.(payload);
		},
	);

	useEffect(() => {
		if (!userId) {
			setSocketConnected(false);
			return;
		}

		const socket = backend.petAlertUploads(userId);
		const unsubscribeStatus = socket.on("status", setSocketConnected);
		const unsubscribeMessages = socket.on<PetAlertUploadSocketData>(
			"message",
			async (response) => {
				if (response.channelName !== "pet-alerts:upload-status") {
					return;
				}

				const parsed = petAlertUploadSocketDataSchema.safeParse(response.data);
				if (!parsed.success) {
					return;
				}

				await handleUploadMessage(parsed.data);
			},
		);

		return () => {
			unsubscribeStatus();
			unsubscribeMessages();
		};
	}, [userId]);

	return {
		socketConnected,
	};
};

export const useDeletePetAlert = (userId: string) => {
	return useMutation({
		mutationKey: ["pet-alert", "delete"],
		mutationFn: async (petAlertId: string) => {
			return await backend.petAlerts.delete({ petAlertId, userId });
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["pet-alerts", "list"] });
		},
	});
};

export const useResolvePetAlert = () => {
	return useMutation({
		mutationKey: ["pet-alert", "resolve"],
		mutationFn: async (pulseId: string) => {
			const response = await hono.api.pulse[":id"].$patch({
				param: { id: pulseId },
				json: { status: PulseStatusEnum.Resolved },
			});
			const result = await response.json();
			if (!result.success) {
				Toast.toast.danger(result.message);
			}
			return result.data;
		},
		onSuccess: (_, pulseId) => {
			queryClient.invalidateQueries({
				queryKey: ["pet-alerts", "list"],
			});
			queryClient.invalidateQueries({
				queryKey: ["pulse", "detail", pulseId],
			});
			queryClient.invalidateQueries({
				queryKey: ["pulse", "retrieve"],
			});
			queryClient.invalidateQueries({
				queryKey: ["pulse", "map"],
			});
			Toast.toast.success("Pet alert marked as resolved");
		},
		onError: (error) => {
			Toast.toast.danger(error.message);
		},
	});
};

export const useReportPetAlert = () => {
	return useMutation({
		mutationKey: ["pet-alert", "report"],
		mutationFn: async ({
			pulseId,
			reason,
		}: {
			pulseId: string;
			reason: string;
		}) => {
			const response = await hono.api.reports.$post({
				json: { targetPulseId: pulseId, reason },
			});
			const result = await response.json();
			if (!result.success) {
				throw new Error(result.message || "Failed to submit report");
			}
			return result.data;
		},
		onSuccess: () => {
			Toast.toast.success("Report submitted successfully");
		},
		onError: (error) => {
			Toast.toast.danger(error.message);
		},
	});
};
