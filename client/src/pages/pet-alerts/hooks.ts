import {
	type ClientPetAlert,
	type PetAlertCreatePayload,
	type PetAlertMatch,
	type PetAlertUploadAccepted,
	type PetAlertUploadSocketData,
	petAlertUploadSocketDataSchema,
} from "@client/utils/petAlerts";
import { Toast } from "@heroui/react";
import { PetAlertUploadStatusEnum } from "@shared/types";
import { useMutation, useQuery } from "@tanstack/react-query";
import { backend } from "client/sdk/backend";
import { useCallback, useEffect, useState } from "react";

type UsePetAlertSocketProps = {
	userId: string;
	activeRequestId: string | null;
	onUploadSuccess?: (alertId: string) => void;
};

type PetAlertUploadResponse = PetAlertUploadAccepted | PetAlertUploadSocketData;

export const useGetPetAlerts = () => {
	return useQuery({
		queryKey: ["pet-alerts", "list"],
		queryFn: async () => {
			const response = await backend.petAlerts.list();
			if ("data" in response) {
				return response.data;
			}
			return [] as ClientPetAlert[];
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
	activeRequestId,
	onUploadSuccess,
}: UsePetAlertSocketProps) => {
	const [socketConnected, setSocketConnected] = useState(false);
	const [uploadStatus, setUploadStatus] =
		useState<PetAlertUploadStatusEnum | null>(null);
	const [activeAlertId, setActiveAlertId] = useState<string | null>(null);
	const [matches, setMatches] = useState<PetAlertMatch[]>([]);
	const [isLoadingMatches, setIsLoadingMatches] = useState(false);

	const loadMatches = useCallback(
		async (userId: string, petAlertId: string) => {
			setIsLoadingMatches(true);

			try {
				const nextMatches = await backend.petAlertMatches.list(
					userId,
					petAlertId,
				);
				setMatches(nextMatches);
			} catch (error) {
				Toast.toast.danger(
					error instanceof Error
						? error.message
						: "Failed to load potential pet matches.",
				);
			} finally {
				setIsLoadingMatches(false);
			}
		},
		[],
	);

	const syncUpload = useCallback(
		async (userId: string, payload: PetAlertUploadResponse | null) => {
			if (!payload) {
				return;
			}

			setUploadStatus(payload.status);
			setActiveAlertId(payload.alertId);

			if (payload.status === PetAlertUploadStatusEnum.Failed) {
				const errorMessage =
					"error" in payload ? payload.error : "Pet alert upload failed.";
				Toast.toast.danger(errorMessage || "Pet alert upload failed.");
				return;
			}

			if (payload.status === PetAlertUploadStatusEnum.Success) {
				onUploadSuccess?.(payload.alertId);
				await loadMatches(userId, payload.alertId);
			}
		},
		[loadMatches, onUploadSuccess],
	);

	const reset = useCallback(() => {
		setUploadStatus(null);
		setActiveAlertId(null);
		setMatches([]);
		setIsLoadingMatches(false);
	}, []);

	const markUploadFailed = useCallback(() => {
		setUploadStatus(PetAlertUploadStatusEnum.Failed);
	}, []);

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

				if (!activeRequestId) {
					return;
				}

				const parsed = petAlertUploadSocketDataSchema.safeParse(response.data);
				if (!parsed.success) {
					return;
				}

				if (parsed.data.requestId !== activeRequestId) {
					return;
				}

				await syncUpload(userId, parsed.data);
			},
		);

		return () => {
			unsubscribeStatus();
			unsubscribeMessages();
		};
	}, [activeRequestId, syncUpload, userId]);

	return {
		socketConnected,
		uploadStatus,
		activeAlertId,
		matches,
		isLoadingMatches,
		syncUpload,
		reset,
		markUploadFailed,
	};
};
