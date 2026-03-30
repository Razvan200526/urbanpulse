import { CustomPlayer } from "@client/components/audio/CustomPlayer";
import { Button } from "@client/components/Button/Button";
import { ProgressChip } from "@client/components/chips/ProgressChip";
import { HelpIcon } from "@client/components/icons/HelpIcon";
import { SignalIcon } from "@client/components/icons/SignalIcon";
import { useAuth } from "@client/hooks/useAuth";
import { useConfirmPulse, useCreateReport } from "@client/hooks/useModeration";
import { Chip, cn, Drawer, Toast } from "@heroui/react";
import type { PulseType } from "@server/db/schema";
import { PulseEnum, PulseStatusEnum } from "@shared/types";
import { formatDate } from "@shared/utils/formatDate";
import {
	AlertTriangleIcon,
	CheckCircle2Icon,
	ClockIcon,
	FlagIcon,
	MapPinIcon,
	PackageIcon,
	ShieldCheckIcon,
	Wrench,
	XCircleIcon,
	ZapIcon,
} from "lucide-react";
import { useState } from "react";
import { useOfferHelp, useUpdatePulse } from "../hooks";
import { MetaRow } from "./MetaRow";
import { UrgencyMeter } from "./UrgencyMeter";

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

	return (
		<Drawer key="right">
			<Drawer.Trigger>
				<button
					type="button"
					className="sr-only"
					tabIndex={-1}
					aria-hidden="true"
				/>
			</Drawer.Trigger>
			<Drawer.Backdrop
				variant="transparent"
				isOpen={isOpen}
				onOpenChange={onOpenChange}
			>
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

								<p className="text-foreground leading-snug tracking-tight">
									{pulse.title}
								</p>

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
							{/*{pulse.imageUrls && (
								<div>
									{pulse.imageUrls.map((url, index) => (
										<img
											key={index}
											src={url}
											alt={`Pulse ${index + 1}`}
											className="w-full"
										/>
									))}
								</div>
							)}*/}
							{pulse.audioUrl && (
								<CustomPlayer
									mediaBlobUrl={pulse.audioUrl}
									showButtons={false}
								/>
							)}
							{isOwner && pulse.status === PulseStatusEnum.Active && (
								<div className="rounded bg-surface border border-border p-4 space-y-3">
									<p className="text-xs font-medium tracking-widest uppercase text-muted">
										Your pulse
									</p>
									<div className="flex flex-wrap gap-2">
										<Button
											variant="primary"
											size="sm"
											isDisabled={updatePulse.isPending}
											startContent={<CheckCircle2Icon className="size-4" />}
											onPress={() =>
												updatePulse.mutate(
													{
														pulseId: pulse.id,
														status: PulseStatusEnum.Resolved,
													},
													{
														onSuccess: () =>
															Toast.toast.success("Marked as resolved"),
														onError: (err) =>
															Toast.toast.danger(
																err instanceof Error
																	? err.message
																	: "Could not update pulse",
															),
													},
												)
											}
										>
											Mark resolved
										</Button>
										<Button
											variant="danger-soft"
											size="sm"
											isDisabled={updatePulse.isPending}
											startContent={<XCircleIcon className="size-4" />}
											onPress={() =>
												updatePulse.mutate(
													{
														pulseId: pulse.id,
														status: PulseStatusEnum.Dismissed,
													},
													{
														onSuccess: () =>
															Toast.toast.success("Pulse dismissed"),
														onError: (err) =>
															Toast.toast.danger(
																err instanceof Error
																	? err.message
																	: "Could not update pulse",
															),
													},
												)
											}
										>
											Dismiss
										</Button>
									</div>
								</div>
							)}
							{!isOwner && user?.user.id && (
								<div className="rounded bg-surface border border-border p-4 space-y-3">
									<p className="text-xs font-medium tracking-widest uppercase text-muted">
										Community trust
									</p>
									<div className="flex flex-wrap gap-2">
										<Button
											variant="outline"
											size="sm"
											isDisabled={
												confirmPulse.isPending ||
												pulse.status !== PulseStatusEnum.Active
											}
											startContent={<ShieldCheckIcon className="size-4" />}
											onPress={() =>
												confirmPulse.mutate(
													{ pulseId: pulse.id },
													{
														onSuccess: (response) => {
															Toast.toast.success(response.message);
														},
														onError: (error: unknown) =>
															Toast.toast.danger(
																error instanceof Error
																	? error.message
																	: "Could not confirm pulse",
															),
													},
												)
											}
										>
											Confirm pulse
										</Button>
										<Button
											variant="danger-soft"
											size="sm"
											startContent={<FlagIcon className="size-4" />}
											onPress={() => setIsReporting((current) => !current)}
										>
											{isReporting ? "Hide report form" : "Report concern"}
										</Button>
									</div>
									<p className="text-xs text-muted">
										Confirm only when you can verify this pulse nearby. Report
										it if the content looks abusive, unsafe, or misleading.
									</p>
									{isReporting && (
										<div className="space-y-3 rounded border border-danger-soft-hover bg-danger/5 p-3">
											<div className="flex items-start gap-2 text-danger">
												<AlertTriangleIcon className="size-4 shrink-0 mt-0.5" />
												<p className="text-xs leading-relaxed">
													Reports go to moderators for review. Add enough
													context so the moderation team can act quickly.
												</p>
											</div>
											<textarea
												value={reportReason}
												onChange={(event) =>
													setReportReason(event.target.value)
												}
												rows={4}
												maxLength={500}
												placeholder="What’s wrong with this pulse?"
												className="w-full rounded border border-border bg-surface px-3 py-2 text-sm outline-none transition focus:border-danger"
											/>
											<div className="flex items-center justify-between gap-3">
												<span className="text-[11px] text-muted">
													{reportReason.length}/500
												</span>
												<Button
													size="sm"
													variant="danger"
													isPending={createReport.isPending}
													isDisabled={reportReason.trim().length < 5}
													onPress={() =>
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
																onError: (error: unknown) =>
																	Toast.toast.danger(
																		error instanceof Error
																			? error.message
																			: "Could not submit report",
																	),
															},
														)
													}
												>
													Submit report
												</Button>
											</div>
										</div>
									)}
								</div>
							)}
						</Drawer.Body>
						<Drawer.Footer className="flex items-center justify-end gap-3">
							<Button variant="danger-soft" onPress={() => onOpenChange(false)}>
								Close
							</Button>
							{canOfferHelp && (
								<Button
									variant="primary"
									startContent={<HelpIcon className="size-4" />}
									isPending={offerHelp.isPending}
									onPress={() =>
										offerHelp.mutate(
											{ pulseId: pulse.id },
											{
												onSuccess: () => {
													Toast.toast.success(
														"Your offer was sent to the poster",
													);
													onOpenChange(false);
												},
												onError: (err) =>
													Toast.toast.danger(
														err instanceof Error
															? err.message
															: "Could not offer help",
													),
											},
										)
									}
								>
									Offer help
								</Button>
							)}
						</Drawer.Footer>
					</Drawer.Dialog>
				</Drawer.Content>
			</Drawer.Backdrop>
		</Drawer>
	);
}
