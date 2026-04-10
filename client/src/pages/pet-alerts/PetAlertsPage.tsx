import { Button } from "@client/components/Button/Button";
import { Header } from "@client/components/Header";
import type { ModalRefType } from "@client/components/Modal";
import { ScrollShadow, Separator } from "@heroui/react";
import { PlusSquareIcon } from "lucide-react";
import { useRef } from "react";
import { CreateAlertModal } from "./components/CreateAlertModal";
import { PetAlertList } from "./components/PetAlertList";
import { useGetPetAlerts } from "./hooks";

export const PetAlertsPage = () => {
	const createModalRef = useRef<ModalRefType>(null);
	const { data: alerts, isLoading, refetch } = useGetPetAlerts();

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
					<div className="mx-auto max-w-7xl">
						<PetAlertList alerts={alerts} isLoading={isLoading} />
					</div>
				</ScrollShadow>
			</div>

			<CreateAlertModal modalRef={createModalRef} onSuccess={() => refetch()} />
		</div>
	);
};
