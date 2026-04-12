import { AppDrawer } from "@client/components/AppDrawer";
import { SignalIcon } from "@client/components/icons/SignalIcon";
import type { TextAreaRefType } from "@client/components/TextArea";
import { useAuth } from "@client/hooks/useAuth";
import { useConfirmPulse, useCreateReport } from "@client/hooks/useModeration";
import type { ClientPulseType } from "@client/utils/types";
import { Drawer } from "@heroui/react";
import { PulseEnum, PulseStatusEnum } from "@shared/types";
import {
	CheckCircle2Icon,
	PackageIcon,
	PawPrint,
	Wrench,
	XCircleIcon,
	ZapIcon,
} from "lucide-react";
import { useRef, useState } from "react";
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
	[PulseEnum.PetAlert]: {
		icon: PawPrint,
		label: "Pet Alert",
		accent: "text-secondary",
		badgeBg: `bg-secondary/10 border-secondary text-secondary`,
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
	const { mutateAsync: updatePulse, isPending: isPulseUpdating } =
		useUpdatePulse();
	const { mutateAsync: offerHelp, isPending: isOfferingHelpPending } =
		useOfferHelp();
	const { mutateAsync: confirmPulse, isPending: isPulseConfirming } =
		useConfirmPulse();
	const { mutateAsync: createReport, isPending: isCreatingReport } =
		useCreateReport();
	const reportRef = useRef<TextAreaRefType | null>(null);
	const [isReporting, setIsReporting] = useState(false);
	const isOwner = user?.user.id === pulse.userId;
	const canOfferHelp =
		!isOwner && pulse.status === PulseStatusEnum.Active && user?.user.id;

	const handlePulseStatusUpdate = async (status: PulseStatusEnum) => {
		await updatePulse({
			pulseId: pulse.id,
			status,
		});
	};

	const handleConfirmPulse = async () => {
		await confirmPulse({ pulseId: pulse.id });
	};

	const handleSubmitReport = async () => {
		await createReport({
			targetPulseId: pulse.id,
			reason: reportRef.current?.getValue() || "",
		});
	};

	const handleOfferHelp = async () => {
		await offerHelp({ pulseId: pulse.id });
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
						isOfferPending={isOfferingHelpPending}
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
						isPending={isPulseUpdating}
						onResolve={() => handlePulseStatusUpdate(PulseStatusEnum.Resolved)}
						onDismiss={() => handlePulseStatusUpdate(PulseStatusEnum.Dismissed)}
					/>
				)}
				{!isOwner && user?.user.id && (
					<CommunityActionsSection
						reportRef={reportRef}
						canConfirm={pulse.status === PulseStatusEnum.Active}
						isConfirming={isPulseConfirming}
						isReportPending={isCreatingReport}
						isReporting={isReporting}
						onToggleReporting={() => setIsReporting((current) => !current)}
						onConfirm={handleConfirmPulse}
						onSubmitReport={handleSubmitReport}
					/>
				)}
			</div>
		</AppDrawer>
	);
}
