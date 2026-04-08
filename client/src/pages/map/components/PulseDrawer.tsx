import { AppDrawer } from "@client/components/AppDrawer";
import { SignalIcon } from "@client/components/icons/SignalIcon";
import { useAuth } from "@client/hooks/useAuth";
import { useConfirmPulse, useCreateReport } from "@client/hooks/useModeration";
import type { ClientPulseType } from "@client/utils/types";
import { Drawer, Toast } from "@heroui/react";
import { PulseEnum, PulseStatusEnum } from "@shared/types";
import {
	CheckCircle2Icon,
	PackageIcon,
	Wrench,
	XCircleIcon,
	ZapIcon,
} from "lucide-react";
import { useState } from "react";
import { useOfferHelp, useUpdatePulse } from "../hooks";
import {
	CommunityActionsSection,
	DrawerFooterActions,
	OwnerActionsSection,
	PulseDrawerHeader,
	PulseDrawerSummary,
} from "./pulse-drawer/PulseDrawerSections";

const PULSE_TYPE_CONFIG: Record<
	PulseEnum,
	{
		icon: React.FC<{ className?: string }>;
		label: string;
		accent: string;
		badgeBg: string;
	}
> = {
	[PulseEnum.Emergency]: {
		icon: SignalIcon,
		label: "Emergency",
		accent: "text-danger",
		badgeBg: `bg-danger/10 border-danger text-danger`,
	},
	[PulseEnum.Skill]: {
		icon: Wrench,
		label: "Skill",
		accent: "text-accent",
		badgeBg: `bg-blue/10 border-blue text-accent`,
	},
	[PulseEnum.Item]: {
		icon: PackageIcon,
		label: "Item",
		accent: "text-primary",
		badgeBg: `bg-primary/10 border-primary text-primary`,
	},
};

const STATUS_CONFIG: Record<
	PulseStatusEnum,
	{ label: string; icon: React.FC<{ className?: string }>; color: string }
> = {
	[PulseStatusEnum.Active]: {
		label: "Active",
		icon: ZapIcon,
		color: "text-accent",
	},
	[PulseStatusEnum.Resolved]: {
		label: "Resolved",
		icon: CheckCircle2Icon,
		color: "text-success",
	},
	[PulseStatusEnum.Dismissed]: {
		label: "Dismissed",
		icon: XCircleIcon,
		color: "text-muted",
	},
};

interface PulseDrawerProps {
	pulse: ClientPulseType;
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
}

export function PulseDrawer({ pulse, isOpen, onOpenChange }: PulseDrawerProps) {
	const typeCfg = PULSE_TYPE_CONFIG[pulse.type];
	const statusCfg = STATUS_CONFIG[pulse.status];
	const { data: user } = useAuth();
	const updatePulse = useUpdatePulse();
	const offerHelp = useOfferHelp();
	const confirmPulse = useConfirmPulse();
	const createReport = useCreateReport();
	const [reportReason, setReportReason] = useState("");
	const [isReporting, setIsReporting] = useState(false);
	const isOwner = user?.user.id === pulse.userId;
	const canOfferHelp =
		!isOwner && pulse.status === PulseStatusEnum.Active && user?.user.id;

	const handlePulseStatusUpdate = (
		status: PulseStatusEnum,
		successMessage: string,
	) => {
		updatePulse.mutate(
			{
				pulseId: pulse.id,
				status,
			},
			{
				onSuccess: () => {
					Toast.toast.success(successMessage);
					onOpenChange(false);
				},
				onError: (error) =>
					Toast.toast.danger(
						error instanceof Error ? error.message : "Could not update pulse",
					),
			},
		);
	};

	const handleConfirmPulse = () => {
		confirmPulse.mutate(
			{ pulseId: pulse.id },
			{
				onSuccess: (response) => {
					Toast.toast.success(response.message);
				},
				onError: (error) =>
					Toast.toast.danger(
						error instanceof Error ? error.message : "Could not confirm pulse",
					),
			},
		);
	};

	const handleSubmitReport = () => {
		createReport.mutate(
			{
				targetPulseId: pulse.id,
				reason: reportReason.trim(),
			},
			{
				onSuccess: (response) => {
					Toast.toast.success(response.message);
					setReportReason("");
					setIsReporting(false);
				},
				onError: (error) =>
					Toast.toast.danger(
						error instanceof Error ? error.message : "Could not submit report",
					),
			},
		);
	};

	const handleOfferHelp = () => {
		offerHelp.mutate(
			{ pulseId: pulse.id },
			{
				onSuccess: () => {
					Toast.toast.success("Your offer was sent to the poster");
					onOpenChange(false);
				},
				onError: (error) =>
					Toast.toast.danger(
						error instanceof Error ? error.message : "Could not offer help",
					),
			},
		);
	};

	return (
		<AppDrawer
			isOpen={isOpen}
			onOpenChange={onOpenChange}
			backdrop="blur"
			trigger={<div />}
			header={<PulseDrawerHeader pulse={pulse} typeConfig={typeCfg} />}
			footer={
				<Drawer.Footer className="shrink-0 border-t border-border bg-surface/95 px-4 py-4 backdrop-blur md:px-5">
					<DrawerFooterActions
						canOfferHelp={Boolean(canOfferHelp)}
						isOfferPending={offerHelp.isPending}
						onClose={() => onOpenChange(false)}
						onOfferHelp={handleOfferHelp}
					/>
				</Drawer.Footer>
			}
			dialogClassName="w-full md:w-[min(42rem,100vw)] border-accent"
			bodyClassName="min-h-0 flex-1 overflow-y-auto p-0"
		>
			<PulseDrawerSummary
				pulse={pulse}
				typeConfig={typeCfg}
				statusConfig={statusCfg}
			/>
			<div className="px-4 pb-8 md:px-5 md:pb-10">
				{isOwner && pulse.status === PulseStatusEnum.Active && (
					<OwnerActionsSection
						isPending={updatePulse.isPending}
						onResolve={() =>
							handlePulseStatusUpdate(
								PulseStatusEnum.Resolved,
								"Marked as resolved",
							)
						}
						onDismiss={() =>
							handlePulseStatusUpdate(
								PulseStatusEnum.Dismissed,
								"Pulse dismissed",
							)
						}
					/>
				)}
				{!isOwner && user?.user.id && (
					<CommunityActionsSection
						canConfirm={pulse.status === PulseStatusEnum.Active}
						isConfirming={confirmPulse.isPending}
						isReportPending={createReport.isPending}
						isReporting={isReporting}
						reportReason={reportReason}
						onToggleReporting={() => setIsReporting((current) => !current)}
						onReportReasonChange={setReportReason}
						onConfirm={handleConfirmPulse}
						onSubmitReport={handleSubmitReport}
					/>
				)}
			</div>
		</AppDrawer>
	);
}
