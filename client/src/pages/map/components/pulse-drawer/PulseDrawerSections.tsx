import { CustomPlayer } from "@client/components/audio/CustomPlayer";
import { Button } from "@client/components/Button/Button";
import { ProgressChip } from "@client/components/chips/ProgressChip";
import { HelpIcon } from "@client/components/icons/HelpIcon";
import { TextArea, type TextAreaRefType } from "@client/components/TextArea";
import { MetaRow } from "@client/pages/map/components/MetaRow";
import { normalizeAssetUrl } from "@client/utils/normalizeAssetUrl";
import type { ClientPulseType } from "@client/utils/types";
import { Chip, cn } from "@heroui/react";
import { formatDate } from "@shared/utils/formatDate";
import {
	AlertTriangleIcon,
	CheckCircle2Icon,
	ClockIcon,
	FlagIcon,
	MapPinIcon,
	ShieldCheckIcon,
	XCircleIcon,
} from "lucide-react";
import { UrgencyMeter } from "../UrgencyMeter";

type PulseTypeConfig = {
	icon: React.ComponentType<{ className?: string }>;
	label: string;
	accent: string;
	badgeBg: string;
};

type PulseStatusConfig = {
	label: string;
	icon: React.ComponentType<{ className?: string }>;
	color: string;
};

type PulseDrawerHeaderProps = {
	pulse: ClientPulseType;
	typeConfig: PulseTypeConfig;
};

type PulseDrawerSummaryProps = {
	pulse: ClientPulseType;
	typeConfig: PulseTypeConfig;
	statusConfig: PulseStatusConfig;
};

type OwnerActionsProps = {
	isPending: boolean;
	onResolve: () => void;
	onDismiss: () => void;
};

type CommunityActionsProps = {
	canConfirm: boolean;
	isConfirming: boolean;
	isReportPending: boolean;
	isReporting: boolean;
	onToggleReporting: () => void;
	onConfirm: () => void;
	onSubmitReport: () => void;
	reportRef: React.RefObject<TextAreaRefType | null>;
};

type DrawerFooterActionsProps = {
	canOfferHelp: boolean;
	isOfferPending: boolean;
	onClose: () => void;
	onOfferHelp: () => void;
};

const renderVerificationBadges = (pulse: ClientPulseType) => {
	return (
		<>
			{pulse.isVerified !== null && (
				<span
					className={cn(
						"inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-medium",
						pulse.isVerified
							? "border-success bg-success/10 text-success"
							: "border-muted bg-muted/10 text-muted",
					)}
				>
					<ShieldCheckIcon className="size-3" />
					{pulse.isVerified ? "Verified" : "Unverified"}
				</span>
			)}

			{pulse.isResolved && (
				<span className="inline-flex items-center gap-1 rounded-full border border-success bg-success px-2 py-1 text-xs font-medium text-success">
					<CheckCircle2Icon className="size-3" />
					Resolved
				</span>
			)}
		</>
	);
};

export const PulseDrawerHeader = ({
	pulse,
	typeConfig,
}: PulseDrawerHeaderProps) => {
	const TypeIcon = typeConfig.icon;
	const isApproximateLocation = pulse.locationPrecision === "approximate";

	return (
		<div className="relative overflow-hidden border-b border-accent px-4 pt-5 pb-5 md:px-5 md:pt-4 md:pb-6">
			<div className="pointer-events-none absolute inset-0 bg-linear-to-b" />
			<div className="relative flex flex-col gap-3">
				<div className="flex flex-wrap items-center gap-2">
					<Chip
						className={cn(
							"gap-1 rounded-full border border-accent bg-accent/5",
							typeConfig.badgeBg,
						)}
					>
						<TypeIcon className={cn("size-4", typeConfig.icon)} />
						<p className={typeConfig.label}>{typeConfig.label}</p>
					</Chip>
					{pulse.incidentType ? (
						<span className="rounded border border-accent/25 bg-surface px-2 py-1 text-xs font-medium text-accent">
							{pulse.incidentType.label}
						</span>
					) : null}
					{renderVerificationBadges(pulse)}
				</div>

				<p className="leading-snug tracking-tight text-accent font-semibold">
					{pulse.title}
				</p>

				<div className="flex items-center gap-4 text-xs text-muted">
					<span className="flex items-center gap-1">
						<MapPinIcon className="size-3" />
						{isApproximateLocation ? "Approximate area" : "Exact location"}
						{" · "}
						{pulse.position.x.toFixed(4)}, {pulse.position.y.toFixed(4)}
					</span>
					<span className="flex items-center gap-1">
						<ClockIcon className="size-3" />
						{formatDate(pulse.createdAt)}
					</span>
				</div>
			</div>
		</div>
	);
};

export const PulseDrawerSummary = ({
	pulse,
	typeConfig,
	statusConfig,
}: PulseDrawerSummaryProps) => {
	const TypeIcon = typeConfig.icon;
	const StatusIcon = statusConfig.icon;
	const isApproximateLocation = pulse.locationPrecision === "approximate";

	return (
		<div className="flex flex-col gap-4 px-4 pt-3 pb-8 md:px-5 md:pb-10">
			<div className="rounded border border-border bg-surface p-4">
				<p className="text-sm font-semibold text-accent">About</p>
				{pulse.description ? (
					<p className="text-sm leading-relaxed text-muted">
						{pulse.description}
					</p>
				) : (
					<p className="text-sm italic text-muted">No description provided.</p>
				)}
			</div>

			<div className="flex items-center justify-between rounded border border-border bg-surface px-4 py-3">
				<span className="text-xs font-medium uppercase tracking-widest text-muted">
					Urgency
				</span>
				<UrgencyMeter urgency={pulse.urgency} />
			</div>

			<div className="rounded border border-border bg-surface px-4">
				<MetaRow label="Status">
					<span className={cn("flex items-center gap-1.5", statusConfig.color)}>
						<StatusIcon className="size-3.5" />
						{statusConfig.label}
					</span>
				</MetaRow>

				<MetaRow label="Signal">
					<span className="flex items-center gap-1.5 text-accent">
						<TypeIcon className="size-3.5" />
						{typeConfig.label}
					</span>
				</MetaRow>

				{pulse.incidentType ? (
					<MetaRow label="Incident type">{pulse.incidentType.label}</MetaRow>
				) : null}

				<MetaRow label="Upload">
					<ProgressChip status={pulse.pulseUploadState} />
				</MetaRow>

				<MetaRow
					label={isApproximateLocation ? "Approximate area" : "Coordinates"}
				>
					<span className="font-mono text-xs text-muted">
						{pulse.position.x.toFixed(5)}, {pulse.position.y.toFixed(5)}
					</span>
				</MetaRow>
				{isApproximateLocation && (
					<MetaRow label="Privacy">
						<span className="text-xs text-muted">
							Exact coordinates stay hidden until direct coordination starts.
						</span>
					</MetaRow>
				)}
			</div>

			{pulse.audioUrl && (
				<CustomPlayer
					mediaBlobUrl={normalizeAssetUrl(pulse.audioUrl)}
					showButtons={false}
				/>
			)}
			{pulse.imageUrls.length > 0 &&
				pulse.imageUrls.map((url) => (
					<img
						width={60}
						key={url}
						alt="pulse-image"
						src={normalizeAssetUrl(url)}
					/>
				))}
		</div>
	);
};

export const OwnerActionsSection = ({
	isPending,
	onResolve,
	onDismiss,
}: OwnerActionsProps) => {
	return (
		<div className="rounded border border-border bg-surface p-4">
			<p className="text-xs font-medium uppercase tracking-widest text-muted">
				Your pulse
			</p>
			<div className="mt-3 flex flex-wrap gap-2">
				<Button
					variant="primary"
					size="sm"
					isDisabled={isPending}
					startContent={<CheckCircle2Icon className="size-4" />}
					onPress={onResolve}
				>
					Mark resolved
				</Button>
				<Button
					variant="danger-soft"
					size="sm"
					isDisabled={isPending}
					startContent={<XCircleIcon className="size-4" />}
					onPress={onDismiss}
				>
					Dismiss
				</Button>
			</div>
		</div>
	);
};

export const CommunityActionsSection = ({
	canConfirm,
	isConfirming,
	isReportPending,
	isReporting,
	onToggleReporting,
	onConfirm,
	onSubmitReport,
	reportRef,
}: CommunityActionsProps) => {
	return (
		<div className="rounded border border-border bg-surface p-4">
			<p className="text-xs font-medium uppercase tracking-widest text-muted">
				Community trust
			</p>
			<div className="mt-3 flex flex-wrap gap-2">
				<Button
					variant="outline"
					size="sm"
					isDisabled={!canConfirm || isConfirming}
					startContent={<ShieldCheckIcon className="size-4" />}
					onPress={onConfirm}
				>
					Confirm pulse
				</Button>
				<Button
					variant="danger-soft"
					size="sm"
					startContent={<FlagIcon className="size-4" />}
					onPress={onToggleReporting}
				>
					{isReporting ? "Hide report form" : "Report concern"}
				</Button>
			</div>
			<p className="mt-3 text-xs text-muted">
				Confirm only when you can verify this pulse nearby. Report it if the
				content looks abusive, unsafe, or misleading.
			</p>
			{isReporting && (
				<div className="mt-3 space-y-3 rounded border border-danger-soft-hover bg-danger/5 p-3">
					<div className="flex items-start gap-2 text-danger">
						<AlertTriangleIcon className="mt-0.5 size-4 shrink-0" />
						<p className="text-xs leading-relaxed">
							Reports go to moderators for review. Add enough context so the
							moderation team can act quickly.
						</p>
					</div>
					<TextArea
						inputWrapperClassname="bg-danger-soft border border-danger"
						label=""
						ref={reportRef}
						onChange={(e) => reportRef.current?.setValue(e.target.value)}
						rows={4}
						maxLength={500}
						placeholder="What’s wrong with this pulse?"
						className="focus-within:border-danger"
					/>
					<div className="flex items-center justify-end gap-3">
						<Button
							size="sm"
							variant="danger"
							isPending={isReportPending}
							onPress={onSubmitReport}
						>
							Submit report
						</Button>
					</div>
				</div>
			)}
		</div>
	);
};

export const DrawerFooterActions = ({
	canOfferHelp,
	isOfferPending,
	onClose,
	onOfferHelp,
}: DrawerFooterActionsProps) => {
	return (
		<div className="flex w-full flex-col-reverse gap-3 md:flex-row md:items-center md:justify-end">
			<Button variant="danger-soft" onPress={onClose}>
				Close
			</Button>
			{canOfferHelp && (
				<Button
					variant="primary"
					startContent={<HelpIcon className="size-4" />}
					isPending={isOfferPending}
					onPress={onOfferHelp}
				>
					Offer help
				</Button>
			)}
		</div>
	);
};
