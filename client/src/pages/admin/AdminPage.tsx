import { Button } from "@client/components/Button/Button";
import { Header } from "@client/components/Header";
import { Modal } from "@client/components/Modal";
import { ClusterMarker } from "@client/components/map/ClusterMarker";
import { MapComponent } from "@client/components/map/MapComponent";
import { PageLoader } from "@client/components/PageLoader";
import { P } from "@client/components/typography";
import { useAdminOverview } from "@client/hooks/useAdminOverview";
import { useGetGeolocation } from "@client/hooks/useGetGeolocation";
import {
	type ClientIncidentType,
	useAdminIncidentTypes,
	useCreateIncidentType,
	useUpdateIncidentType,
} from "@client/hooks/useIncidentTypes";
import {
	type AdminUserListItem,
	useAdminBanUser,
	useAdminCreateCrisis,
	useAdminDuplicatePulses,
	useAdminReports,
	useAdminRevokeUserSession,
	useAdminSetRole,
	useAdminUnbanUser,
	useAdminUserSessions,
	useAdminUsers,
	useMergePulse,
	useModeratePulse,
	useReviewReport,
} from "@client/hooks/useModeration";
import { useRetrieveClusters } from "@client/pages/map/hooks";
import type { ClientClusterType } from "@client/utils/clusterTypes";
import { Card, cn, ScrollShadow, Separator, Toast } from "@heroui/react";
import { PulseStatusEnum, ReportStatusEnum } from "@shared/types";
import {
	DEFAULT_CITY_CENTER,
	DEFAULT_LOCAL_CRISIS_RADIUS_METERS,
} from "@shared/utils/crisis";
import { formatDate } from "@shared/utils/formatDate";
import {
	AlertCircleIcon,
	ArrowRightLeft,
	Bell,
	ClipboardList,
	MapPin,
	MapPinned,
	Plus,
	Search,
	ShieldAlert,
	Users,
	Wrench,
	X,
} from "lucide-react";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import {
	ActivityList,
	AdminCrisisMapClickCapture,
	AdminDraftCrisisOverlay,
	type DraftPoint,
	EmptyState,
	IncidentTypeRow,
	IncidentTypeSelect,
	SectionCard,
	SessionRow,
} from "./components";

const metricCards = [
	{
		key: "users",
		label: "Users",
		description: "Registered accounts",
		icon: Users,
	},
	{
		key: "pulses",
		label: "Pulses",
		description: "Active and archived alerts",
		icon: MapPinned,
	},
	{
		key: "resources",
		label: "Resources",
		description: "Shared local inventory",
		icon: Wrench,
	},
	{
		key: "reports",
		label: "Reports",
		description: "Filed moderation reports",
		icon: ShieldAlert,
	},
	{
		key: "transactions",
		label: "Transactions",
		description: "Support exchanges tracked",
		icon: ClipboardList,
	},
	{
		key: "notifications",
		label: "Notifications",
		description: "Delivered and pending notices",
		icon: Bell,
	},
] as const;

const banReason = "Moderator action: account access suspended pending review";

const adminClusterRadiusMeters = 10_000;

const toneClassNameByReportStatus: Record<string, string> = {
	[ReportStatusEnum.Pending]: "border-warning/30 bg-warning/10 text-warning",
	[ReportStatusEnum.Resolved]: "border-success/30 bg-success/10 text-success",
	[ReportStatusEnum.Dismissed]: "border-border bg-surface-secondary text-muted",
};

const statusPillClassName = (status: string) =>
	toneClassNameByReportStatus[status] ??
	"border-border bg-surface-secondary text-muted";

const roleLabel = (role: AdminUserListItem["role"]) =>
	Array.isArray(role) ? role.join(", ") : role || "user";

export const AdminPage = () => {
	const { data, isPending, error } = useAdminOverview();
	const { data: reports = [] } = useAdminReports();
	const { data: duplicates = [] } = useAdminDuplicatePulses();
	const { data: incidentTypes = [] } = useAdminIncidentTypes();
	const [userSearch, setUserSearch] = useState("");
	const deferredUserSearch = useDeferredValue(userSearch);
	const { data: users = [] } = useAdminUsers(deferredUserSearch);
	const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
	const [newIncidentLabel, setNewIncidentLabel] = useState("");
	const [newIncidentDescription, setNewIncidentDescription] = useState("");
	const { data: selectedUserSessions = [] } =
		useAdminUserSessions(selectedUserId);
	const reviewReport = useReviewReport();
	const moderatePulse = useModeratePulse();
	const mergePulse = useMergePulse();
	const { coords } = useGetGeolocation();
	const createCrisis = useAdminCreateCrisis();
	const createIncidentType = useCreateIncidentType();
	const updateIncidentType = useUpdateIncidentType();
	const setRole = useAdminSetRole();
	const banUser = useAdminBanUser();
	const unbanUser = useAdminUnbanUser();
	const revokeSession = useAdminRevokeUserSession();
	const { data: clusterList = [] } = useRetrieveClusters(
		{
			lat: coords?.lat ?? DEFAULT_CITY_CENTER.lat,
			lng: coords?.long ?? DEFAULT_CITY_CENTER.lng,
			radius: adminClusterRadiusMeters,
		},
		Boolean(data),
	);
	const [draftPoint, setDraftPoint] = useState<DraftPoint | null>(null);
	const [isGlobalModalOpen, setGlobalModalOpen] = useState(false);
	const [isLocalModalOpen, setLocalModalOpen] = useState(false);
	const [globalIncidentTypeId, setGlobalIncidentTypeId] = useState("");
	const [localIncidentTypeId, setLocalIncidentTypeId] = useState("");
	const [localRadiusInput, setLocalRadiusInput] = useState(
		String(DEFAULT_LOCAL_CRISIS_RADIUS_METERS),
	);

	const selectedUser = useMemo(
		() => users.find((entry) => entry.id === selectedUserId) ?? null,
		[selectedUserId, users],
	);

	const activeIncidentTypes = useMemo(
		() => incidentTypes.filter((item) => item.isActive),
		[incidentTypes],
	);
	const globalIncidentTypes = useMemo(
		() => [...incidentTypes].sort((a, b) => a.sortOrder - b.sortOrder),
		[incidentTypes],
	);

	const localRadiusMeters = useMemo(() => {
		const parsed = Number(localRadiusInput);
		return Number.isFinite(parsed)
			? Math.max(100, Math.min(50_000, Math.round(parsed)))
			: DEFAULT_LOCAL_CRISIS_RADIUS_METERS;
	}, [localRadiusInput]);
	const hasDraftPoint =
		typeof draftPoint?.lat === "number" && typeof draftPoint?.lng === "number";

	useEffect(() => {
		if (globalIncidentTypes.length === 0) {
			return;
		}

		const hasGlobalSelected = globalIncidentTypes.some(
			(item) => item.id === globalIncidentTypeId,
		);
		if (!hasGlobalSelected) {
			setGlobalIncidentTypeId(globalIncidentTypes[0]?.id ?? "");
		}
		const hasLocalSelected = activeIncidentTypes.some(
			(item) => item.id === localIncidentTypeId,
		);
		if (!hasLocalSelected) {
			setLocalIncidentTypeId(activeIncidentTypes[0]?.id ?? "");
		}
	}, [
		activeIncidentTypes,
		globalIncidentTypeId,
		globalIncidentTypes,
		localIncidentTypeId,
	]);

	const onRoleToggle = (entry: AdminUserListItem) => {
		const nextRole = entry.role === "admin" ? "user" : "admin";
		setRole.mutate(
			{
				userId: entry.id,
				role: nextRole,
			},
			{
				onSuccess: () =>
					Toast.toast.success(
						`${entry.email} is now ${nextRole === "admin" ? "an admin" : "a user"}.`,
					),
				onError: (error) =>
					Toast.toast.danger(
						error instanceof Error ? error.message : "Could not update role",
					),
			},
		);
	};

	const onBanToggle = (entry: AdminUserListItem) => {
		if (entry.banned) {
			unbanUser.mutate(
				{ userId: entry.id },
				{
					onSuccess: () => Toast.toast.success(`${entry.email} was unbanned.`),
					onError: (error) =>
						Toast.toast.danger(
							error instanceof Error ? error.message : "Could not unban user",
						),
				},
			);
			return;
		}

		banUser.mutate(
			{
				userId: entry.id,
				banReason,
			},
			{
				onSuccess: () => Toast.toast.success(`${entry.email} was banned.`),
				onError: (error) =>
					Toast.toast.danger(
						error instanceof Error ? error.message : "Could not ban user",
					),
			},
		);
	};

	const onCreateIncidentType = () => {
		const label = newIncidentLabel.trim();
		if (!label) {
			Toast.toast.danger("Incident type name is required.");
			return;
		}

		createIncidentType.mutate(
			{
				label,
				description: newIncidentDescription.trim(),
			},
			{
				onSuccess: () => {
					setNewIncidentLabel("");
					setNewIncidentDescription("");
				},
				onError: (error) =>
					Toast.toast.danger(
						error instanceof Error
							? error.message
							: "Could not create incident type",
					),
			},
		);
	};

	const onSaveIncidentType = (
		incidentType: ClientIncidentType,
		payload: { label: string; description: string; sortOrder: number },
	) => {
		updateIncidentType.mutate(
			{
				param: { id: incidentType.id },
				json: payload,
			},
			{
				onError: (error) =>
					Toast.toast.danger(
						error instanceof Error
							? error.message
							: "Could not update incident type",
					),
			},
		);
	};

	const onToggleIncidentType = (incidentType: ClientIncidentType) => {
		updateIncidentType.mutate(
			{
				param: { id: incidentType.id },
				json: { isActive: !incidentType.isActive },
			},
			{
				onError: (error) =>
					Toast.toast.danger(
						error instanceof Error
							? error.message
							: "Could not update incident type",
					),
			},
		);
	};

	const onTriggerGlobalCrisis = () => {
		if (!globalIncidentTypeId) {
			Toast.toast.danger("Choose an incident type first.");
			return;
		}

		createCrisis.mutate(
			{
				scope: "global",
				incidentTypeId: globalIncidentTypeId,
			},
			{
				onSuccess: () => {
					setGlobalModalOpen(false);
				},
				onError: (error) =>
					Toast.toast.danger(
						error instanceof Error
							? error.message
							: "Could not activate global crisis mode",
					),
			},
		);
	};

	const onTriggerLocalCrisis = () => {
		if (!hasDraftPoint || !draftPoint) {
			Toast.toast.danger("Choose a location on the map first.");
			return;
		}
		if (!localIncidentTypeId) {
			Toast.toast.danger("Choose an incident type first.");
			return;
		}

		createCrisis.mutate(
			{
				scope: "local",
				incidentTypeId: localIncidentTypeId,
				lat: draftPoint.lat,
				lng: draftPoint.lng,
				radius: localRadiusMeters,
			},
			{
				onSuccess: () => {
					setLocalModalOpen(false);
					setDraftPoint(null);
					setLocalRadiusInput(String(DEFAULT_LOCAL_CRISIS_RADIUS_METERS));
				},
				onError: (error) =>
					Toast.toast.danger(
						error instanceof Error
							? error.message
							: "Could not activate local crisis mode",
					),
			},
		);
	};

	const onMapDraftPointSelected = (point: DraftPoint) => {
		setDraftPoint(point);
		setLocalModalOpen(true);
	};

	if (isPending) {
		return <PageLoader />;
	}

	if (error || !data) {
		return (
			<div className="flex h-[calc(100dvh)] w-full flex-col overflow-hidden bg-surface">
				<Header title="Moderation" />
				<Separator />
				<div className="flex flex-1 items-center justify-center p-4 sm:p-8">
					<Card className="w-full max-w-md border border-accent/25 bg-surface shadow-none">
						<Card.Content className="flex flex-col items-center gap-4 p-6 text-center sm:p-8">
							<AlertCircleIcon className="size-14 text-danger" />
							<div className="space-y-2">
								<p className="text-lg font-semibold text-accent">
									Admin access required
								</p>
								<P>This page is restricted to administrators only.</P>
							</div>
						</Card.Content>
					</Card>
				</div>
			</div>
		);
	}

	return (
		<div className="flex h-[calc(100dvh)] w-full flex-col overflow-hidden bg-surface">
			<Header title="Moderation" />
			<Separator />
			<ScrollShadow className="flex-1" size={10}>
				<div className="mx-auto flex max-w-7xl flex-col gap-4 p-4 pb-24 sm:gap-6 sm:p-6 sm:pb-10">
					<div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
						{metricCards.map((card) => {
							const Icon = card.icon;

							return (
								<Card
									key={card.key}
									className="border border-accent-soft-hover bg-surface shadow-none"
								>
									<Card.Content className="flex items-start justify-between gap-3 p-4">
										<div className="min-w-0">
											<p className="text-sm font-medium text-accent">
												{card.label}
											</p>
											<p className="mt-1 text-2xl font-semibold text-foreground">
												{data.counts[card.key]}
											</p>
											<p className="mt-1 text-xs text-muted">
												{card.description}
											</p>
										</div>
										<div className="rounded border border-accent/30 bg-accent/5 p-2.5 text-accent">
											<Icon className="size-4" />
										</div>
									</Card.Content>
								</Card>
							);
						})}
					</div>

					<div className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(18rem,0.95fr)]">
						<div className="space-y-6">
							<SectionCard
								title="Crisis Management"
								description="Trigger city-wide crisis mode or create a local crisis directly from the map."
								action={
									<Button
										size="sm"
										variant="danger"
										startContent={<ShieldAlert className="size-4" />}
										onPress={() => setGlobalModalOpen(true)}
									>
										Trigger Global Crisis
									</Button>
								}
								contentClassName="space-y-4"
							>
								<div className="space-y-3 rounded border border-accent-soft-hover bg-surface-secondary/10 p-3">
									<div className="flex items-start justify-between gap-3">
										<div>
											<p className="text-sm font-medium text-accent">
												Local crisis map
											</p>
											<p className="mt-1 text-xs text-muted">
												Click anywhere on the map to set the local crisis
												epicenter and radius.
											</p>
										</div>
										<Button
											size="sm"
											variant="outline"
											startContent={<MapPin className="size-4" />}
											isDisabled={!hasDraftPoint}
											onPress={() => setLocalModalOpen(true)}
										>
											Configure local crisis
										</Button>
									</div>
									<div className="h-80 overflow-hidden rounded border border-accent-soft-hover">
										{coords ? (
											<MapComponent
												center={[coords.long, coords.lat]}
												zoom={15}
											>
												{clusterList.map((cluster: ClientClusterType) => (
													<ClusterMarker key={cluster.id} cluster={cluster} />
												))}
												<AdminCrisisMapClickCapture
													onMapClick={onMapDraftPointSelected}
												/>
												<AdminDraftCrisisOverlay
													draftPoint={draftPoint}
													radiusMeters={localRadiusMeters}
												/>
											</MapComponent>
										) : (
											<div className="flex h-80 items-center justify-center rounded border border-accent-soft-hover bg-surface-secondary/10" />
										)}
										<div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
											<span>Active clusters visible: {clusterList.length}</span>
											{hasDraftPoint && draftPoint ? (
												<span>
													Draft: {draftPoint.lat.toFixed(5)},{" "}
													{draftPoint.lng.toFixed(5)} ({localRadiusMeters}m)
												</span>
											) : (
												<span>No draft point selected yet.</span>
											)}
										</div>
									</div>
								</div>
								<Modal
									isOpen={isGlobalModalOpen}
									onOpenChange={setGlobalModalOpen}
									header="Confirm Global Crisis"
									size="sm"
									footer={
										<>
											<Button
												variant="outline"
												startContent={<X className="size-4" />}
												onPress={() => setGlobalModalOpen(false)}
											>
												Cancel
											</Button>
											<Button
												variant="danger"
												startContent={<ShieldAlert className="size-4" />}
												isPending={createCrisis.isPending}
												onPress={onTriggerGlobalCrisis}
											>
												Confirm Global Crisis
											</Button>
										</>
									}
								>
									<div className="space-y-4 px-4 pb-4 sm:px-6 sm:pb-6">
										<div className="space-y-1">
											<p className="text-sm text-muted">
												This will notify all connected users and mark Bucharest
												as an active crisis zone.
											</p>
										</div>
										<IncidentTypeSelect
											value={globalIncidentTypeId}
											options={globalIncidentTypes}
											onChange={setGlobalIncidentTypeId}
										/>
									</div>
								</Modal>

								<Modal
									isOpen={isLocalModalOpen}
									onOpenChange={setLocalModalOpen}
									header="Configure Local Crisis"
									size="sm"
									footer={
										<>
											<Button
												variant="outline"
												startContent={<X className="size-4" />}
												onPress={() => setLocalModalOpen(false)}
											>
												Cancel
											</Button>
											<Button
												variant="danger"
												startContent={<ShieldAlert className="size-4" />}
												isPending={createCrisis.isPending}
												onPress={onTriggerLocalCrisis}
											>
												Activate Local Crisis
											</Button>
										</>
									}
								>
									<div className="space-y-4 px-4 pb-4 sm:px-6 sm:pb-6">
										<p className="text-sm text-muted">
											Pick incident type and radius for the selected map point.
										</p>
										<IncidentTypeSelect
											value={localIncidentTypeId}
											options={activeIncidentTypes}
											onChange={setLocalIncidentTypeId}
										/>
										<label className="flex flex-col gap-1.5 text-sm text-accent">
											Radius (meters)
											<input
												value={localRadiusInput}
												inputMode="numeric"
												onChange={(event) =>
													setLocalRadiusInput(event.target.value)
												}
												className="h-10 rounded border border-accent/25 bg-surface px-3 text-sm text-foreground outline-none focus:border-accent"
											/>
										</label>
										<div className="rounded border border-accent/20 bg-accent/5 px-3 py-2 text-xs text-accent">
											{hasDraftPoint && draftPoint
												? `Selected point: ${draftPoint.lat.toFixed(5)}, ${draftPoint.lng.toFixed(5)}`
												: "Click the map to select a location first."}
										</div>
									</div>
								</Modal>
							</SectionCard>

							<SectionCard
								title="Moderation Queue"
								description="Review reports, retain valid alerts, or remove unsafe content."
								className={reports.length > 0 ? "border-accent/35" : undefined}
							>
								{reports.length > 0 ? (
									<div className="space-y-3">
										{reports.map((entry: any) => {
											const isPendingReport =
												entry.status === ReportStatusEnum.Pending;

											return (
												<div
													key={entry.id}
													className="rounded border border-accent/20 bg-surface-secondary/10 p-4"
												>
													<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
														<div className="min-w-0 space-y-1">
															<p className="font-medium text-foreground">
																{entry.reason}
															</p>
															<p className="text-xs text-muted">
																Reported by{" "}
																{entry.reporter?.name ||
																	entry.reporter?.email ||
																	"Unknown"}{" "}
																· {formatDate(new Date(entry.createdAt))}
															</p>
															<p className="text-xs text-muted">
																{entry.targetPulse
																	? `Pulse: ${entry.targetPulse.title} (${entry.targetPulse.status})${
																			entry.targetPulse.incidentType
																				? ` · ${entry.targetPulse.incidentType.label}`
																				: ""
																		}`
																	: entry.targetUser
																		? `Target user: ${entry.targetUser.name || entry.targetUser.email}`
																		: "No linked pulse or user"}
															</p>
														</div>
														<div className="flex flex-wrap gap-2">
															<span
																className={cn(
																	"rounded-full border px-2 py-1 text-[11px] font-medium",
																	statusPillClassName(entry.status),
																)}
															>
																{entry.status}
															</span>
															{entry.targetPulse?.isVerified ? (
																<span className="rounded-full border border-success/30 bg-success/10 px-2 py-1 text-[11px] font-medium text-success">
																	Verified pulse
																</span>
															) : null}
														</div>
													</div>

													{entry.targetPulse?.description ? (
														<p className="mt-3 text-sm text-muted">
															{entry.targetPulse.description}
														</p>
													) : null}

													<div className="mt-4">
														{isPendingReport ? (
															<div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
																<Button
																	size="sm"
																	variant="danger"
																	className="w-full sm:w-auto"
																	isPending={reviewReport.isPending}
																	onPress={() =>
																		reviewReport.mutate(
																			{
																				reportId: entry.id,
																				status: ReportStatusEnum.Resolved,
																				pulseStatus: entry.targetPulse
																					? PulseStatusEnum.Dismissed
																					: undefined,
																				moderationNote:
																					"Dismissed after moderator review",
																			},
																			{
																				onSuccess: () =>
																					Toast.toast.success(
																						"Report resolved",
																					),
																				onError: (error: unknown) =>
																					Toast.toast.danger(
																						error instanceof Error
																							? error.message
																							: "Could not review report",
																					),
																			},
																		)
																	}
																>
																	Remove pulse
																</Button>
																<Button
																	size="sm"
																	variant="primary"
																	className="w-full sm:w-auto"
																	isPending={reviewReport.isPending}
																	onPress={() =>
																		reviewReport.mutate(
																			{
																				reportId: entry.id,
																				status: ReportStatusEnum.Resolved,
																				pulseStatus: PulseStatusEnum.Resolved,
																				moderationNote:
																					"Report resolved, pulse retained",
																			},
																			{
																				onSuccess: () =>
																					Toast.toast.success(
																						"Report resolved and pulse retained",
																					),
																				onError: (error: unknown) =>
																					Toast.toast.danger(
																						error instanceof Error
																							? error.message
																							: "Could not review report",
																					),
																			},
																		)
																	}
																>
																	Keep pulse
																</Button>
																{entry.targetPulse ? (
																	<Button
																		size="sm"
																		variant="outline"
																		className="w-full sm:w-auto"
																		isPending={moderatePulse.isPending}
																		onPress={() =>
																			moderatePulse.mutate(
																				{
																					pulseId: entry.targetPulse?.id || "",
																					isVerified:
																						!entry.targetPulse?.isVerified,
																					moderationNote: entry.targetPulse
																						?.isVerified
																						? "Verification removed by moderator"
																						: "Verification granted by moderator",
																				},
																				{
																					onSuccess: () =>
																						Toast.toast.success(
																							entry.targetPulse?.isVerified
																								? "Pulse unverified"
																								: "Pulse verified",
																						),
																					onError: (error: unknown) =>
																						Toast.toast.danger(
																							error instanceof Error
																								? error.message
																								: "Could not moderate pulse",
																						),
																				},
																			)
																		}
																	>
																		{entry.targetPulse.isVerified
																			? "Remove verification"
																			: "Force verify"}
																	</Button>
																) : null}
																<Button
																	size="sm"
																	variant="outline"
																	className="w-full sm:w-auto"
																	isPending={reviewReport.isPending}
																	onPress={() =>
																		reviewReport.mutate(
																			{
																				reportId: entry.id,
																				status: ReportStatusEnum.Dismissed,
																				moderationNote:
																					"Report dismissed by moderator",
																			},
																			{
																				onSuccess: () =>
																					Toast.toast.success(
																						"Report dismissed",
																					),
																				onError: (error: unknown) =>
																					Toast.toast.danger(
																						error instanceof Error
																							? error.message
																							: "Could not review report",
																					),
																			},
																		)
																	}
																>
																	Dismiss report
																</Button>
															</div>
														) : (
															<p className="text-xs text-muted">
																This report has already been reviewed.
															</p>
														)}
													</div>
												</div>
											);
										})}
									</div>
								) : (
									<EmptyState message="No reports are waiting in the moderation queue." />
								)}
							</SectionCard>

							<SectionCard
								title="Duplicate Review"
								description="Compare strong duplicate candidates and merge them into one canonical pulse."
							>
								{duplicates.length > 0 ? (
									<div className="space-y-3">
										{duplicates.map((entry) => (
											<div
												key={`${entry.sourcePulse.id}-${entry.targetPulse.id}`}
												className="rounded border border-accent/20 bg-surface-secondary/10 p-4"
											>
												<div className="grid gap-3 lg:grid-cols-2">
													<div className="rounded border border-accent/20 bg-surface px-3 py-3">
														<p className="text-xs font-medium text-accent">
															Source pulse
														</p>
														<p className="mt-1 font-medium text-foreground">
															{entry.sourcePulse.title}
														</p>
														<p className="mt-1 text-xs text-muted">
															{entry.sourcePulse.type} ·{" "}
															{entry.sourcePulse.incidentType
																? `${entry.sourcePulse.incidentType.label} · `
																: ""}
															{formatDate(
																new Date(entry.sourcePulse.createdAt),
															)}
														</p>
													</div>
													<div className="rounded border border-accent/20 bg-surface px-3 py-3">
														<p className="text-xs font-medium text-accent">
															Canonical target
														</p>
														<p className="mt-1 font-medium text-foreground">
															{entry.targetPulse.title}
														</p>
														<p className="mt-1 text-xs text-muted">
															{entry.targetPulse.type} ·{" "}
															{entry.targetPulse.incidentType
																? `${entry.targetPulse.incidentType.label} · `
																: ""}
															{formatDate(
																new Date(entry.targetPulse.createdAt),
															)}
														</p>
													</div>
												</div>

												<div className="mt-3 flex flex-wrap gap-2 text-xs text-muted">
													<span className="rounded border border-accent/20 bg-accent/5 px-2 py-1">
														Distance {entry.distanceMeters}m
													</span>
													<span className="rounded border border-accent/20 bg-accent/5 px-2 py-1">
														Time gap {entry.hoursApart}h
													</span>
													<span className="rounded border border-accent/20 bg-accent/5 px-2 py-1">
														Similarity {Math.round(entry.titleSimilarity * 100)}
														%
													</span>
												</div>

												<div className="mt-4">
													<Button
														size="sm"
														variant="primary"
														className="w-full sm:w-auto"
														isPending={mergePulse.isPending}
														startContent={<ArrowRightLeft className="size-4" />}
														onPress={() =>
															mergePulse.mutate(
																{
																	sourcePulseId: entry.sourcePulse.id,
																	targetPulseId: entry.targetPulse.id,
																	reason:
																		"Merged by moderator after duplicate review",
																},
																{
																	onSuccess: () =>
																		Toast.toast.success(
																			"Duplicate pulse merged",
																		),
																	onError: (error: unknown) =>
																		Toast.toast.danger(
																			error instanceof Error
																				? error.message
																				: "Could not merge pulses",
																		),
																},
															)
														}
													>
														Merge into canonical pulse
													</Button>
												</div>
											</div>
										))}
									</div>
								) : (
									<EmptyState message="No strong duplicate pulse candidates right now." />
								)}
							</SectionCard>

							<SectionCard
								title="Incident Types"
								description="Manage the emergency categories shown in the pulse reporting flow."
								contentClassName="space-y-4"
							>
								<div className="rounded border border-accent/20 bg-surface-secondary/10 p-4">
									<div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] lg:items-end">
										<label className="flex min-w-0 flex-col gap-1.5 text-sm text-accent">
											Name
											<input
												value={newIncidentLabel}
												onChange={(event) =>
													setNewIncidentLabel(event.target.value)
												}
												placeholder="Shelter need"
												className="h-10 rounded border border-accent/25 bg-surface px-3 text-sm text-foreground outline-none placeholder:text-muted focus:border-accent"
											/>
										</label>
										<label className="flex min-w-0 flex-col gap-1.5 text-sm text-accent">
											Description
											<input
												value={newIncidentDescription}
												onChange={(event) =>
													setNewIncidentDescription(event.target.value)
												}
												placeholder="Optional"
												className="h-10 rounded border border-accent/25 bg-surface px-3 text-sm text-foreground outline-none placeholder:text-muted focus:border-accent"
											/>
										</label>
										<Button
											size="sm"
											variant="primary"
											className="w-full lg:w-auto"
											startContent={<Plus className="size-4" />}
											isPending={createIncidentType.isPending}
											onPress={onCreateIncidentType}
										>
											Add type
										</Button>
									</div>
								</div>

								{incidentTypes.length > 0 ? (
									<div className="space-y-3">
										{incidentTypes.map((incidentType) => (
											<IncidentTypeRow
												key={incidentType.id}
												incidentType={incidentType}
												isPending={updateIncidentType.isPending}
												onSave={onSaveIncidentType}
												onToggleActive={onToggleIncidentType}
											/>
										))}
									</div>
								) : (
									<EmptyState message="No incident types are configured yet." />
								)}
							</SectionCard>
						</div>

						<SectionCard
							title="Recent Activity"
							description="Newest items across reports, pulses, and resources."
							contentClassName="space-y-5"
						>
							<ActivityList
								title="Reports"
								items={data.recentReports}
								emptyMessage="No reports have been filed yet."
								renderItem={(report) => (
									<div
										key={report.id}
										className="rounded border border-accent/20 bg-surface-secondary/10 px-3 py-3"
									>
										<p className="font-medium text-accent">{report.reason}</p>
										<p className="mt-1 text-xs text-muted">
											{report.status} · {formatDate(new Date(report.createdAt))}
										</p>
									</div>
								)}
							/>
							<ActivityList
								title="Pulses"
								items={data.recentPulses}
								emptyMessage="No pulses have been created yet."
								renderItem={(pulse) => (
									<div
										key={pulse.id}
										className="rounded border border-accent-soft-hover bg-surface-secondary/10 px-3 py-3"
									>
										<p className="font-medium text-accent">{pulse.title}</p>
										<p className="mt-1 text-xs text-muted">
											{pulse.type} · {pulse.status} ·{" "}
											{pulse.incidentType
												? `${pulse.incidentType.label} · `
												: ""}
											{formatDate(new Date(pulse.createdAt))}
										</p>
									</div>
								)}
							/>
							<ActivityList
								title="Resources"
								items={data.recentResources}
								emptyMessage="No resources have been shared yet."
								renderItem={(resource) => (
									<div
										key={resource.id}
										className="rounded border border-accent-soft-hover bg-surface-secondary/10 px-3 py-3"
									>
										<p className="font-medium text-accent">{resource.name}</p>
										<p className="mt-1 text-xs text-muted">
											{resource.availability} ·{" "}
											{formatDate(new Date(resource.createdAt))}
										</p>
									</div>
								)}
							/>
						</SectionCard>
					</div>

					<SectionCard
						title="User Access"
						description="Search users, change roles, suspend access, and revoke active sessions."
						action={
							<div className="flex items-center gap-2 rounded border border-accent/25 bg-accent/5 px-3 py-2">
								<Search className="size-4 shrink-0 text-accent" />
								<input
									value={userSearch}
									onChange={(event) => setUserSearch(event.target.value)}
									placeholder="Search by email"
									className="w-full min-w-0 bg-transparent text-sm text-foreground outline-none placeholder:text-muted"
								/>
							</div>
						}
					>
						<div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.85fr)]">
							<div className="space-y-3">
								{users.length > 0 ? (
									users.map((entry) => (
										<div
											key={entry.id}
											className={cn(
												"rounded border p-4 transition-colors",
												selectedUserId === entry.id
													? "border-accent/40 bg-accent/5"
													: "border-accent/20 bg-surface-secondary/10",
											)}
										>
											<div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
												<div className="min-w-0 space-y-1">
													<p className="font-medium text-accent">
														{entry.name || entry.email}
													</p>
													<p className="break-all text-sm text-muted">
														{entry.email}
													</p>
													<div className="mt-2 flex flex-wrap gap-2">
														<span className="rounded-full border border-accent/20 bg-accent/5 px-2 py-1 text-[11px] font-medium text-accent">
															{roleLabel(entry.role)}
														</span>
														<span
															className={cn(
																"rounded-full border px-2 py-1 text-[11px] font-medium",
																entry.banned
																	? "border-danger/30 bg-danger/10 text-danger"
																	: "border-success/30 bg-success/10 text-success",
															)}
														>
															{entry.banned ? "Banned" : "Active"}
														</span>
													</div>
													{entry.banReason ? (
														<p className="pt-1 text-xs text-muted">
															Reason: {entry.banReason}
														</p>
													) : null}
												</div>

												<div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap lg:w-auto lg:justify-end">
													<Button
														size="sm"
														variant="outline"
														className="w-full sm:w-auto"
														onPress={() => setSelectedUserId(entry.id)}
													>
														{selectedUserId === entry.id
															? "Inspecting sessions"
															: "Inspect sessions"}
													</Button>
													<Button
														size="sm"
														variant="primary"
														className="w-full sm:w-auto"
														isPending={setRole.isPending}
														onPress={() => onRoleToggle(entry)}
													>
														{entry.role === "admin"
															? "Demote to user"
															: "Promote to admin"}
													</Button>
													<Button
														size="sm"
														variant={entry.banned ? "outline" : "danger"}
														className="w-full sm:w-auto"
														isPending={banUser.isPending || unbanUser.isPending}
														onPress={() => onBanToggle(entry)}
													>
														{entry.banned ? "Unban user" : "Ban user"}
													</Button>
												</div>
											</div>
										</div>
									))
								) : (
									<EmptyState message="No users matched your current search." />
								)}
							</div>

							<div className="rounded border border-accent/25 bg-surface-secondary/20 p-4 sm:p-5">
								<div className="space-y-1">
									<p className="font-medium text-accent">Active sessions</p>
									<p className="text-xs text-muted">
										{selectedUser
											? `Review and revoke sessions for ${selectedUser.name || selectedUser.email}.`
											: "Select a user to inspect sessions."}
									</p>
								</div>

								<div className="mt-4 space-y-3">
									{selectedUserSessions.length > 0 ? (
										selectedUserSessions.map((session) => (
											<SessionRow
												key={session.token || session.id}
												session={session}
												isPending={revokeSession.isPending}
												onRevoke={(sessionToken) =>
													revokeSession.mutate(
														{ sessionToken },
														{
															onSuccess: () =>
																Toast.toast.success("Session revoked"),
															onError: (error: unknown) =>
																Toast.toast.danger(
																	error instanceof Error
																		? error.message
																		: "Could not revoke session",
																),
														},
													)
												}
											/>
										))
									) : (
										<EmptyState
											message={
												selectedUserId
													? "No active sessions were returned for this user."
													: "No user selected."
											}
										/>
									)}
								</div>
							</div>
						</div>
					</SectionCard>
				</div>
			</ScrollShadow>
		</div>
	);
};
