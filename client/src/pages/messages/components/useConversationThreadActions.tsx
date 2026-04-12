import type { DropdownItemDataType } from "@client/components/Dropdown";
import type { ModalRefType } from "@client/components/Modal";
import { useCreateReport } from "@client/hooks/useModeration";
import { Toast } from "@heroui/react";
import { CheckCheckIcon, ShieldAlertIcon, Trash2 } from "lucide-react";
import { useRef } from "react";
import {
	type ConversationSummary,
	type ConversationThread as ConversationThreadType,
	useDeleteConversation,
	useResolveConversation,
} from "../hooks";
import { useNavigate } from "react-router";

type UseConversationThreadActionsParams = {
	conversation: ConversationSummary | ConversationThreadType | null;
	conversationId: string | null;
	currentUserId?: string;
	onBack: () => void;
};

export const useConversationThreadActions = ({
	conversation,
	conversationId,
	currentUserId,
	onBack,
}: UseConversationThreadActionsParams) => {
	const navigate = useNavigate();
	const reportModalRef = useRef<ModalRefType | null>(null);
	const resolveModalRef = useRef<ModalRefType | null>(null);
	const deleteModalRef = useRef<ModalRefType | null>(null);
	const { mutateAsync: createReport, isPending: isCreatingReport } =
		useCreateReport();
	const {
		mutateAsync: resolveConversation,
		isPending: isResolvingConversation,
	} = useResolveConversation();
	const { mutateAsync: deleteConversation, isPending: isDeletingConversation } =
		useDeleteConversation();

	const otherMember =
		conversation?.members.find((member) => member.id !== currentUserId) ?? null;

	const handleResolveConversation = async () => {
		if (!conversationId) {
			Toast.toast.danger("No conversation selected");
			return;
		}

		const res = await resolveConversation({ conversationId });
		if (!res.success) {
			Toast.toast.danger("Failed to mark conversation as resolved");
			return;
		}

		navigate("/messages");
		Toast.toast.success("Conversation marked as resolved");
		onBack();
	};

	const handleDeleteConversation = async () => {
		if (!conversationId) {
			Toast.toast.danger("No conversation selected");
			return;
		}

		const res = await deleteConversation({ conversationId });
		if (!res.success) {
			Toast.toast.danger("Failed to hide conversation");
			return;
		}

		navigate("/messages");
		Toast.toast.success("Conversation hidden");
		onBack();
	};

	const handleSubmitReport = async (reason: string) => {
		if (!otherMember) {
			Toast.toast.danger("Couldn't find the user to report");
			return;
		}

		const res = await createReport({
			targetUserId: otherMember.id,
			reason,
		});
		if (!res.success) {
			Toast.toast.danger("Failed to submit report");
			return;
		}

		navigate("/messages");
		Toast.toast.success("Report submitted");
	};

	const dropdownItems: DropdownItemDataType[] = [
		{
			key: "resolve",
			label: "Mark as resolved",
			icon: <CheckCheckIcon className="size-4 text-success" />,
			className:
				"bg-surface hover:bg-success-soft-hover transition-colors duration-150 ease-out",
			labelClassName: "text-success",
			onAction: () => resolveModalRef.current?.open(),
		},
		{
			key: "delete",
			label: "Hide conversation",
			icon: <Trash2 className="size-4 text-danger" />,
			className:
				"bg-surface hover:bg-danger-soft-hover transition-colors duration-150 ease-out",
			labelClassName: "text-danger",
			onAction: () => deleteModalRef.current?.open(),
		},
		{
			key: "report",
			label: "Report user",
			icon: <ShieldAlertIcon className="size-4 text-warning" />,
			className:
				"bg-surface hover:bg-warning-soft-hover transition-colors durations-150 ease-out",
			labelClassName: "text-warning",
			onAction: () => reportModalRef.current?.open(),
		},
	];

	return {
		deleteModalRef,
		dropdownItems,
		handleDeleteConversation,
		handleResolveConversation,
		handleSubmitReport,
		isCreatingReport,
		isDeletingConversation,
		isResolvingConversation,
		reportModalRef,
		reportedUserName: otherMember?.name || "this user",
		resolveModalRef,
	};
};
