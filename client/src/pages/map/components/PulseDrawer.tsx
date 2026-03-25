import {
	CheckCircle2Icon,
	ClockIcon,
	MapPinIcon,
	PackageIcon,
	ShieldCheckIcon,
	Wrench,
	XCircleIcon,
	ZapIcon,
} from "lucide-react";
import { PulseEnum, PulseStatusEnum } from "@shared/types";
import { Chip, cn, Drawer } from "@heroui/react";
import type { PulseType } from "@server/db/schema";
import { MetaRow } from "./MetaRow";
import { formatDate } from "@shared/utils/formatDate";
import { UrgencyMeter } from "./UrgencyMeter";
import { H4 } from "@client/components/typography";
import { ProgressChip } from "@client/components/chips/ProgressChip";
import { SignalIcon } from "@client/components/icons/SignalIcon";
import { Button } from "@client/components/Button/Button";
import { HelpIcon } from "@client/components/icons/HelpIcon";

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
		badgeBg: `bg-danger border-danger text-danger`,
	},
	[PulseEnum.Skill]: {
		icon: Wrench,
		label: "Skill",
		accent: "text-accent",
		badgeBg: `bg-blue border-blue text-accent`,
	},
	[PulseEnum.Item]: {
		icon: PackageIcon,
		label: "Item",
		accent: "text-primary",
		badgeBg: `bg-primary border-primary text-primary`,
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
	pulse: PulseType;
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
}

export function PulseDrawer({ pulse, isOpen, onOpenChange }: PulseDrawerProps) {
	const typeCfg = PULSE_TYPE_CONFIG[pulse.type];
	const statusCfg = STATUS_CONFIG[pulse.status];
	const TypeIcon = typeCfg.icon;
	const StatusIcon = statusCfg.icon;

	return (
		<Drawer isOpen={isOpen} onOpenChange={onOpenChange} key="right">
			<Drawer.Backdrop variant="transparent">
				<Drawer.Content className="overflow-hidden" placement="right">
					<Drawer.Dialog className="rounded-l">
						<Drawer.Header className="relative px-5 pt-4 pb-6 overflow-hidden border border-accent rounded">
							<div
								className={cn(
									"absolute inset-0 bg-linear-to-b pointer-events-none",
								)}
							/>
							<Drawer.Heading className="relative flex flex-col gap-3">
								<div className="flex items-center gap-2 flex-wrap">
									<Chip className="border border-accent bg-accent/5 gap-1 rounded-full">
										<TypeIcon className="size-4 text-accent" />
										<p className="text-accent">{typeCfg.label}</p>
									</Chip>

									{pulse.isVerified !== null && (
										<span
											className={cn(
												"inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border",
												pulse.isVerified
													? `bg-success border-success text-success`
													: `bg-success border-success text-muted`,
											)}
										>
											<ShieldCheckIcon className="size-3" />
											{pulse.isVerified ? "Verified" : "Unverified"}
										</span>
									)}

									{pulse.isResolved && (
										<span
											className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border bg-success border-success text-success`}
										>
											<CheckCircle2Icon className="size-3" />
											Resolved
										</span>
									)}
								</div>

								<H4 className="text-foreground leading-snug tracking-tight">
									{pulse.title}
								</H4>

								<div className="flex items-center gap-4 text-xs text-muted">
									<span className="flex items-center gap-1">
										<MapPinIcon className="size-3" />
										{pulse.position.x.toFixed(4)}, {pulse.position.y.toFixed(4)}
									</span>
									<span className="flex items-center gap-1">
										<ClockIcon className="size-3" />
										{formatDate(pulse.createdAt)}
									</span>
								</div>
							</Drawer.Heading>
						</Drawer.Header>

						<Drawer.Body className="px-5 pt-3 pb-10 flex flex-col gap-4">
							<div className={`rounded bg-surface border border-border p-4`}>
								<p className="text-accent text-sm font-semibold">About</p>
								{pulse.description ? (
									<p className="text-sm text-muted leading-relaxed">
										{pulse.description}
									</p>
								) : (
									<p className="text-sm text-muted italic">
										No description provided.
									</p>
								)}
							</div>

							<div
								className={`rounded bg-surface border border-border px-4 py-3 flex items-center justify-between`}
							>
								<span className="text-xs font-medium tracking-widest uppercase text-muted">
									Urgency
								</span>
								<UrgencyMeter urgency={pulse.urgency} />
							</div>

							<div className={`rounded bg-surface border border-border px-4`}>
								<MetaRow label="Status">
									<span
										className={cn("flex items-center gap-1.5", statusCfg.color)}
									>
										<StatusIcon className="size-3.5" />
										{statusCfg.label}
									</span>
								</MetaRow>

								<MetaRow label="Signal">
									<span className={cn("flex items-center gap-1.5 text-accent")}>
										<TypeIcon className="size-3.5" />
										{typeCfg.label}
									</span>
								</MetaRow>

								<MetaRow label="Upload">
									<ProgressChip status={pulse.pulseUploadState} />
								</MetaRow>

								<MetaRow label="Coordinates">
									<span className="font-mono text-xs text-muted">
										{pulse.position.x.toFixed(5)}, {pulse.position.y.toFixed(5)}
									</span>
								</MetaRow>
							</div>
						</Drawer.Body>
						<div className="flex items-center justify-end gap-3">
							<Button variant="danger-soft" onPress={() => onOpenChange(false)}>
								Close
							</Button>
							<Button
								variant="primary"
								startContent={<HelpIcon className="size-4" />}
							>
								Offer Help
							</Button>
						</div>
					</Drawer.Dialog>
				</Drawer.Content>
			</Drawer.Backdrop>
		</Drawer>
	);
}
