import {
	type PetAlertCreatePayload,
	type PetAlertUploadSocketData,
	petAlertUploadSocketDataSchema,
} from "@client/utils/petAlerts";
import { Toast } from "@heroui/react";
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
