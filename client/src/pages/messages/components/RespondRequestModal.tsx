import { Button } from "@client/components/Button/Button";
import { Modal, type ModalRefType } from "@client/components/Modal";
import { H3 } from "@client/components/typography";
import { useAuth } from "@client/hooks/useAuth";
import { Toast } from "@heroui/react";
import { useRespondToRequest } from "../../resources/hooks";

export const RespondRequestModal = ({
	modalRef,
	transactionId,
	action,
	onSettled,
}: {
	modalRef: React.RefObject<ModalRefType | null>;
	transactionId: string | null;
	action: "accept" | "reject" | null;
	onSettled?: () => void;
}) => {
	const { data: user } = useAuth();
	const { mutateAsync: respond, isPending } = useRespondToRequest(
		user?.user.id || "",
	);

	const handleConfirm = async () => {
		if (!transactionId || !action) return;

		try {
			await respond({
				transactionId,
				accept: action === "accept",
			});
			Toast.toast.success(`Request ${action}ed successfully`);
			modalRef.current?.close();
			onSettled?.();
		} catch {
			Toast.toast.danger(`Failed to ${action} request`);
		}
	};

	return (
		<Modal
			modalRef={modalRef}
			header={
				<header className="flex flex-col items-start justify-start">
					<H3>{action === "accept" ? "Accept Request" : "Reject Request"}</H3>
					<p className="text-muted text-sm">
						{action === "accept"
							? "Allow user to borrow your resource"
							: "Decline the borrow request"}
					</p>
				</header>
			}
			footer={
				<div className="w-full flex items-center justify-end gap-4">
					<Button
						variant="danger-soft"
						size="sm"
						onPress={() => modalRef.current?.close()}
						isDisabled={isPending}
					>
						Cancel
					</Button>
					<Button
						variant="primary"
						size="sm"
						onPress={handleConfirm}
						isPending={isPending}
					>
						Confirm
					</Button>
				</div>
			}
		>
			<div className="p-4 flex flex-col space-y-5">
				<p>
					Are you sure you want to {action} this borrow request from your
					resource?
				</p>
			</div>
		</Modal>
	);
};
