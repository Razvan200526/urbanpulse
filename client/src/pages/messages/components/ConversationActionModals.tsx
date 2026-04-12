import { Button } from "@client/components/Button/Button";
import { Modal, type ModalRefType } from "@client/components/Modal";
import { TextArea, type TextAreaRefType } from "@client/components/TextArea";
import { H4 } from "@client/components/typography";
import { Toast } from "@heroui/react";
import { CheckCheckIcon, Trash2 } from "lucide-react";
import { type RefObject, useRef } from "react";

type ConversationConfirmModalProps = {
	modalRef: RefObject<ModalRefType | null>;
	title: string;
	description: string;
	warning?: string;
	confirmLabel: string;
	confirmVariant?: "primary" | "danger";
	isPending?: boolean;
	icon: React.ReactNode;
	iconClassName?: string;
	titleClassName?: string;
	onConfirm: () => Promise<void> | void;
};

export const ConversationConfirmModal = ({
	modalRef,
	title,
	description,
	warning,
	confirmLabel,
	confirmVariant = "primary",
	isPending = false,
	icon,
	iconClassName,
	titleClassName,
	onConfirm,
}: ConversationConfirmModalProps) => {
	return (
		<Modal
			modalRef={modalRef}
			header={
				<header className="flex flex-col items-start justify-start">
					<div className="flex items-center gap-2">
						<span className={iconClassName}>{icon}</span>
						<H4 className={titleClassName}>{title}</H4>
					</div>
				</header>
			}
			footer={
				<div className="flex w-full items-center justify-end gap-3">
					<Button
						variant="primary"
						size="sm"
						isDisabled={isPending}
						onPress={() => modalRef.current?.close()}
					>
						Cancel
					</Button>
					<Button
						variant={confirmVariant}
						size="sm"
						isDisabled={isPending}
						isPending={isPending}
						onPress={async () => {
							try {
								await onConfirm();
								modalRef.current?.close();
							} catch {}
						}}
					>
						{confirmLabel}
					</Button>
				</div>
			}
		>
			<div className="flex flex-col items-start justify-start space-y-4 p-4">
				<p className="text-sm text-muted">{description}</p>
				{warning ? <p className="text-sm text-danger">{warning}</p> : null}
			</div>
		</Modal>
	);
};

type ConversationReportModalProps = {
	modalRef: RefObject<ModalRefType | null>;
	reportedUserName: string;
	isPending?: boolean;
	onSubmit: (reason: string) => Promise<void> | void;
};

export const ConversationReportModal = ({
	modalRef,
	reportedUserName,
	isPending = false,
	onSubmit,
}: ConversationReportModalProps) => {
	const reasonRef = useRef<TextAreaRefType | null>(null);

	const handleSubmit = async () => {
		const reason = reasonRef.current?.getValue().trim() ?? "";

		if (!reasonRef.current?.validate()) {
			return;
		}

		if (reason.length < 5) {
			Toast.toast.danger("Please share a bit more detail before submitting.");
			return;
		}

		try {
			await onSubmit(reason);
			reasonRef.current?.setValue("");
			modalRef.current?.close();
		} catch {}
	};

	return (
		<Modal
			modalRef={modalRef}
			header={
				<header className="flex flex-col items-start justify-start gap-1">
					<H4 className="text-danger">Report conversation</H4>
					<p className="text-sm text-muted">
						Tell us what happened with {reportedUserName}.
					</p>
				</header>
			}
			footer={
				<div className="flex w-full items-center justify-end gap-3">
					<Button
						variant="primary"
						size="sm"
						isDisabled={isPending}
						onPress={() => {
							reasonRef.current?.setValue("");
							modalRef.current?.close();
						}}
					>
						Cancel
					</Button>
					<Button
						variant="danger"
						size="sm"
						isDisabled={isPending}
						isPending={isPending}
						onPress={handleSubmit}
					>
						Submit report
					</Button>
				</div>
			}
		>
			<div className="space-y-4 p-4">
				<p className="text-sm text-muted">
					Reports are reviewed by the moderation team. Include enough detail for
					us to understand the issue.
				</p>
				<TextArea
					ref={reasonRef}
					label="Reason"
					maxLength={500}
					minRows={4}
					name="report-reason"
					placeholder="Describe the behavior you want us to review..."
				/>
			</div>
		</Modal>
	);
};

type ConversationThreadModalsProps = {
	deleteModalRef: RefObject<ModalRefType | null>;
	handleDeleteConversation: () => Promise<void> | void;
	handleResolveConversation: () => Promise<void> | void;
	handleSubmitReport: (reason: string) => Promise<void> | void;
	isCreatingReport: boolean;
	isDeletingConversation: boolean;
	isResolvingConversation: boolean;
	reportModalRef: RefObject<ModalRefType | null>;
	reportedUserName: string;
	resolveModalRef: RefObject<ModalRefType | null>;
};

export const ConversationThreadModals = ({
	deleteModalRef,
	handleDeleteConversation,
	handleResolveConversation,
	handleSubmitReport,
	isCreatingReport,
	isDeletingConversation,
	isResolvingConversation,
	reportModalRef,
	reportedUserName,
	resolveModalRef,
}: ConversationThreadModalsProps) => {
	return (
		<>
			<ConversationReportModal
				modalRef={reportModalRef}
				isPending={isCreatingReport}
				reportedUserName={reportedUserName}
				onSubmit={handleSubmitReport}
			/>

			<ConversationConfirmModal
				modalRef={resolveModalRef}
				title="Mark conversation as resolved"
				description="This removes the conversation from your inbox while keeping the message history intact for the other participant."
				confirmLabel="Mark resolved"
				icon={<CheckCheckIcon className="size-4" />}
				iconClassName="text-success"
				isPending={isResolvingConversation}
				onConfirm={handleResolveConversation}
			/>

			<ConversationConfirmModal
				modalRef={deleteModalRef}
				title="Delete conversation forever"
				titleClassName="text-danger"
				description="This permanently deletes the conversation and all of its messages for everyone involved."
				warning="This action cannot be undone."
				confirmLabel="Delete forever"
				confirmVariant="danger"
				icon={<Trash2 className="size-4" />}
				iconClassName="text-danger"
				isPending={isDeletingConversation}
				onConfirm={handleDeleteConversation}
			/>
		</>
	);
};
