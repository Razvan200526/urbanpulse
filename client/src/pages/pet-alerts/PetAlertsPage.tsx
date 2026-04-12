import { Button } from "@client/components/Button/Button";
import { Header } from "@client/components/Header";
import type { ModalRefType } from "@client/components/Modal";
import { useAuth } from "@client/hooks/useAuth";
import { queryClient } from "@client/lib/api/client";
import {
	type ClientPetAlert,
	createPetAlertListItem,
	createPetAlertUploadListItem,
	type PetAlertListItem,
	type PetAlertUploadAccepted,
} from "@client/utils/petAlerts";
import { ScrollShadow, Separator, Toast } from "@heroui/react";
import { PetAlertUploadStatusEnum } from "@shared/types";
import { PlusSquareIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { CreateAlertModal } from "./components/CreateAlertModal";
import { PetAlertList } from "./components/PetAlertList";
import { PetMatchReviewDrawer } from "./components/PetMatchReviewDrawer";
import { useGetPetAlerts, usePetAlertSocket } from "./hooks";

const petAlertsQueryKey = ["pet-alerts", "list"] as const;

const updateTransientPetAlert = (
	items: PetAlertListItem[],
	nextItem: PetAlertListItem,
	insertIfMissing: boolean,
) => {
	const existingIndex = items.findIndex(
		(item) =>
			(nextItem.requestId && item.requestId === nextItem.requestId) ||
			item.alert.id === nextItem.alert.id,
	);

	if (existingIndex === -1) {
		return insertIfMissing ? [nextItem, ...items] : items;
	}

	return items.map((item, index) =>
		index === existingIndex ? nextItem : item,
	);
};

const hasMatchingTransientPetAlert = (
	items: PetAlertListItem[],
	nextItem: PetAlertListItem,
) =>
	items.some(
		(item) =>
			(nextItem.requestId && item.requestId === nextItem.requestId) ||
			item.alert.id === nextItem.alert.id,
	);

const buildPetAlertItems = (
	alerts: ClientPetAlert[] | undefined,
	transientItems: PetAlertListItem[],
) => {
	const persistedAlertsById = new Map(
		(alerts ?? []).map((alert) => [alert.id, alert]),
	);
	const representedAlertIds = new Set<string>();
	const items = transientItems.map((item) => {
		const persistedAlert = persistedAlertsById.get(item.alert.id);
		representedAlertIds.add(item.alert.id);

		return {
			...item,
			alert: persistedAlert ?? item.alert,
		};
	});

	for (const alert of alerts ?? []) {
		if (representedAlertIds.has(alert.id)) {
			continue;
		}

		items.push(createPetAlertListItem(alert));
	}

	return items;
};

export const PetAlertsPage = () => {
	const createModalRef = useRef<ModalRefType>(null);
	const { data: user } = useAuth();
	const { data: alerts, isLoading } = useGetPetAlerts();
	const [transientItems, setTransientItems] = useState<PetAlertListItem[]>([]);
	const [reviewingItem, setReviewingItem] = useState<PetAlertListItem | null>(
		null,
	);
	const transientItemsRef = useRef<PetAlertListItem[]>([]);

	const setTrackedTransientItems = useCallback(
		(updater: (current: PetAlertListItem[]) => PetAlertListItem[]) => {
			setTransientItems((current) => {
				const nextItems = updater(current);
				transientItemsRef.current = nextItems;
				return nextItems;
			});
		},
		[],
	);

	const { socketConnected } = usePetAlertSocket({
		userId: user?.user.id || "",
		onUploadMessage: (payload) => {
			const nextItem = createPetAlertUploadListItem(payload);
			if (!hasMatchingTransientPetAlert(transientItemsRef.current, nextItem)) {
				return;
			}

			setTrackedTransientItems((current) =>
				updateTransientPetAlert(current, nextItem, false),
			);

			if (payload.status === PetAlertUploadStatusEnum.Failed) {
				Toast.toast.danger(payload.error || "Pet alert upload failed.");
				return;
			}

			if (payload.status === PetAlertUploadStatusEnum.Success) {
				void queryClient.invalidateQueries({ queryKey: petAlertsQueryKey });
			}
		},
	});

	useEffect(() => {
		setTrackedTransientItems((current) => {
			const nextItems = current.filter((item) => {
				if (item.uploadStatus !== PetAlertUploadStatusEnum.Success) {
					return true;
				}

				return !(alerts ?? []).some((alert) => alert.id === item.alert.id);
			});

			return nextItems.length === current.length ? current : nextItems;
		});
	}, [alerts, setTrackedTransientItems]);

	const handleAlertAccepted = (accepted: PetAlertUploadAccepted) => {
		const nextItem = createPetAlertUploadListItem(accepted);
		setTrackedTransientItems((current) =>
			updateTransientPetAlert(current, nextItem, true),
		);

		if (accepted.status === PetAlertUploadStatusEnum.Failed) {
			Toast.toast.danger("Pet alert upload failed.");
			return;
		}

		if (accepted.status === PetAlertUploadStatusEnum.Success) {
			void queryClient.invalidateQueries({ queryKey: petAlertsQueryKey });
		}
	};

	const items = buildPetAlertItems(alerts, transientItems);

	return (
		<div className="flex h-[calc(100dvh)] w-full min-w-0 flex-col overflow-hidden bg-surface">
			<Header title="Lost & Found Pets">
				<Button
					size="md"
					variant="primary"
					startContent={<PlusSquareIcon className="size-4" />}
					onPress={() => createModalRef.current?.open()}
				>
					Report a Pet
				</Button>
			</Header>
			<Separator />

			<div className="min-h-0 flex-1 overflow-hidden">
				<ScrollShadow
					className="h-full m-4 sm:p-6 lg:p-8 border border-border rounded"
					size={10}
				>
					<div className="max-w-7xl h-full">
						<PetAlertList
							items={items}
							isLoading={isLoading}
							currentUserId={user?.user.id}
							onReviewMatches={(item) => setReviewingItem(item)}
						/>
					</div>
				</ScrollShadow>
			</div>

			<CreateAlertModal
				modalRef={createModalRef}
				onAlertAccepted={handleAlertAccepted}
				socketConnected={socketConnected}
			/>
			<PetMatchReviewDrawer
				petAlertId={reviewingItem?.alert.id ?? null}
				ownerLabel={
					reviewingItem
						? `${reviewingItem.alert.color} ${reviewingItem.alert.petType}`
						: "Pet alert"
				}
				isOpen={Boolean(reviewingItem)}
				onClose={() => setReviewingItem(null)}
			/>
		</div>
	);
};
