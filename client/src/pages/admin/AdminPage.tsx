import { Button } from "@client/components/Button/Button";
import { Header } from "@client/components/Header";
import { PageLoader } from "@client/components/PageLoader";
import { P } from "@client/components/typography";
import { useAdminOverview } from "@client/hooks/useAdminOverview";
import {
	type AdminUserListItem,
	useAdminBanUser,
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
import { Card, ScrollShadow, Separator, Toast } from "@heroui/react";
import { PulseStatusEnum, ReportStatusEnum } from "@shared/types";
import { formatDate } from "@shared/utils/formatDate";
import {
	AlertCircleIcon,
	Bell,
	ClipboardList,
	MapPinned,
	ShieldAlert,
	Users,
	Wrench,
} from "lucide-react";
import { useDeferredValue, useState } from "react";

const metricCards = [
	{
		key: "users",
		label: "Users",
		icon: Users,
	},
	{
		key: "pulses",
		label: "Pulses",
		icon: MapPinned,
	},
	{
		key: "resources",
		label: "Resources",
		icon: Wrench,
	},
	{
		key: "reports",
		label: "Reports",
		icon: ShieldAlert,
	},
	{
		key: "transactions",
		label: "Transactions",
		icon: ClipboardList,
	},
	{
		key: "notifications",
		label: "Notifications",
		icon: Bell,
	},
] as const;

const banReason = "Moderator action: account access suspended pending review";

export const AdminPage = () => {
	const { data, isPending, error } = useAdminOverview();
	const { data: reports = [] } = useAdminReports();
	const { data: duplicates = [] } = useAdminDuplicatePulses();
	const [userSearch, setUserSearch] = useState("");
	const deferredUserSearch = useDeferredValue(userSearch);
	const { data: users = [] } = useAdminUsers(deferredUserSearch);
	const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
	const { data: selectedUserSessions = [] } =
		useAdminUserSessions(selectedUserId);
	const reviewReport = useReviewReport();
	const moderatePulse = useModeratePulse();
	const mergePulse = useMergePulse();
	const setRole = useAdminSetRole();
	const banUser = useAdminBanUser();
	const unbanUser = useAdminUnbanUser();
	const revokeSession = useAdminRevokeUserSession();

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

	if (isPending) {
		return <PageLoader />;
	}

	if (error || !data) {
		return (
			<div className="flex h-[calc(100dvh)] min-w-0 flex-col overflow-hidden bg-surface">
				<Header title="Moderation" />
				<Separator />
				<div className="flex flex-1 items-center justify-center p-4 sm:p-8">
					<div className="flex flex-col space-y-4 items-center">
						<AlertCircleIcon className="size-20 text-danger" />
						<P>This page is restricted to administrators only.</P>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="flex h-[calc(100dvh)] min-w-0 flex-col overflow-hidden bg-surface">
			<Header title="Moderation" />
			<Separator />
			<ScrollShadow className="flex-1 p-4 sm:p-6" size={10}>
				<div className="max-w-6xl mx-auto space-y-6">
					<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
						{metricCards.map((card) => {
							const Icon = card.icon;
							return (
								<Card
									key={card.key}
									className="border border-accent shadow-none"
								>
									<Card.Content className="p-5 flex items-center justify-between">
										<div>
											<p className="text-sm text-muted">{card.label}</p>
											<p className="text-2xl font-semibold mt-1">
												{data.counts[card.key]}
											</p>
										</div>
										<div className="rounded-full border border-accent/30 bg-accent/5 p-3">
											<Icon className="size-5 text-accent" />
										</div>
									</Card.Content>
								</Card>
							);
						})}
					</div>

					<div className="grid gap-6 lg:grid-cols-3">
						<Card className="border border-accent shadow-none">
							<Card.Header>
								<Card.Title>Recent Reports</Card.Title>
							</Card.Header>
							<Card.Content className="p-5 space-y-4">
								{data.recentReports.length > 0 ? (
									data.recentReports.map((report) => (
										<div
											key={report.id}
											className="rounded border border-accent/30 p-3"
										>
											<p className="font-medium">{report.reason}</p>
											<p className="text-xs text-muted mt-1">
												{report.status} ·{" "}
												{formatDate(new Date(report.createdAt))}
											</p>
										</div>
									))
								) : (
									<p className="text-sm text-muted">
										No reports have been filed yet.
									</p>
								)}
							</Card.Content>
						</Card>

						<Card className="border border-accent shadow-none">
							<Card.Header>
								<Card.Title>Recent Pulses</Card.Title>
							</Card.Header>
							<Card.Content className="p-5 space-y-4">
								{data.recentPulses.map((pulse) => (
									<div
										key={pulse.id}
										className="rounded border border-accent/30 p-3"
									>
										<p className="font-medium">{pulse.title}</p>
										<p className="text-xs text-muted mt-1">
											{pulse.type} · {pulse.status} ·{" "}
											{formatDate(new Date(pulse.createdAt))}
										</p>
									</div>
								))}
							</Card.Content>
						</Card>

						<Card className="border border-accent shadow-none">
							<Card.Header>
								<Card.Title>Recent Resources</Card.Title>
							</Card.Header>
							<Card.Content className="p-5 space-y-4">
								{data.recentResources.map((resource) => (
									<div
										key={resource.id}
										className="rounded border border-accent/30 p-3"
									>
										<p className="font-medium">{resource.name}</p>
										<p className="text-xs text-muted mt-1">
											{resource.availability} ·{" "}
											{formatDate(new Date(resource.createdAt))}
										</p>
									</div>
								))}
							</Card.Content>
						</Card>
					</div>

					<Card className="border border-accent shadow-none">
						<Card.Header>
							<Card.Title>Moderation Queue</Card.Title>
							<Card.Description>
								Review reports, verify trustworthy alerts, or remove unsafe
								content.
							</Card.Description>
						</Card.Header>
						<Card.Content className="p-5 space-y-4">
							{reports.length > 0 ? (
								reports.map((entry) => {
									const isPendingReport =
										entry.status === ReportStatusEnum.Pending;

									return (
										<div
											key={entry.id}
											className="rounded border border-accent/30 p-4 space-y-3"
										>
											<div className="flex flex-wrap items-start justify-between gap-3">
												<div className="space-y-1">
													<p className="font-medium">{entry.reason}</p>
													<p className="text-xs text-muted">
														Reported by{" "}
														{entry.reporter?.name ||
															entry.reporter?.email ||
															"Unknown"}{" "}
														· {formatDate(new Date(entry.createdAt))}
													</p>
													<p className="text-xs text-muted">
														Status: {entry.status}
														{entry.targetPulse
															? ` · Pulse: ${entry.targetPulse.title} (${entry.targetPulse.status})`
															: ""}
														{entry.targetUser
															? ` · Target user: ${entry.targetUser.name || entry.targetUser.email}`
															: ""}
													</p>
												</div>
												{entry.targetPulse?.isVerified && (
													<span className="rounded-full border border-success/30 px-2 py-1 text-[11px] uppercase tracking-wide text-success">
														Verified pulse
													</span>
												)}
											</div>

											{entry.targetPulse?.description && (
												<p className="text-sm text-muted">
													{entry.targetPulse.description}
												</p>
											)}

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
																		Toast.toast.success("Report resolved"),
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
													{entry.targetPulse && (
														<Button
															size="sm"
															variant="outline"
															className="w-full sm:w-auto"
															isPending={moderatePulse.isPending}
															onPress={() =>
																moderatePulse.mutate(
																	{
																		pulseId: entry.targetPulse.id,
																		isVerified: !entry.targetPulse.isVerified,
																		moderationNote: entry.targetPulse.isVerified
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
													)}
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
																		Toast.toast.success("Report dismissed"),
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
									);
								})
							) : (
								<p className="text-sm text-muted">
									No reports are waiting in the moderation queue.
								</p>
							)}
						</Card.Content>
					</Card>

					<Card className="border border-accent shadow-none">
						<Card.Header>
							<Card.Title>Duplicate Review</Card.Title>
							<Card.Description>
								Merge likely duplicate pulses into one canonical alert.
							</Card.Description>
						</Card.Header>
						<Card.Content className="p-5 space-y-4">
							{duplicates.length > 0 ? (
								duplicates.map((entry) => (
									<div
										key={`${entry.sourcePulse.id}-${entry.targetPulse.id}`}
										className="rounded border border-accent/30 p-4 space-y-3"
									>
										<div className="grid gap-3 lg:grid-cols-2">
											<div className="rounded border border-accent/20 p-3">
												<p className="text-xs uppercase tracking-wide text-muted">
													Source pulse
												</p>
												<p className="font-medium mt-1">
													{entry.sourcePulse.title}
												</p>
												<p className="text-xs text-muted mt-1">
													{entry.sourcePulse.type} ·{" "}
													{formatDate(new Date(entry.sourcePulse.createdAt))}
												</p>
											</div>
											<div className="rounded border border-accent/20 p-3">
												<p className="text-xs uppercase tracking-wide text-muted">
													Canonical target
												</p>
												<p className="font-medium mt-1">
													{entry.targetPulse.title}
												</p>
												<p className="text-xs text-muted mt-1">
													{entry.targetPulse.type} ·{" "}
													{formatDate(new Date(entry.targetPulse.createdAt))}
												</p>
											</div>
										</div>
										<p className="text-xs text-muted">
											Distance: {entry.distanceMeters}m · Time gap:{" "}
											{entry.hoursApart}h · Title similarity:{" "}
											{Math.round(entry.titleSimilarity * 100)}%
										</p>
										<Button
											size="sm"
											variant="primary"
											className="w-full sm:w-auto"
											isPending={mergePulse.isPending}
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
															Toast.toast.success("Duplicate pulse merged"),
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
								))
							) : (
								<p className="text-sm text-muted">
									No strong duplicate pulse candidates right now.
								</p>
							)}
						</Card.Content>
					</Card>

					<Card className="border border-accent shadow-none">
						<Card.Header>
							<Card.Title>User Access</Card.Title>
							<Card.Description>
								Search users, change roles, suspend access, and revoke sessions.
							</Card.Description>
						</Card.Header>
						<Card.Content className="p-5 space-y-4">
							<input
								value={userSearch}
								onChange={(event) => setUserSearch(event.target.value)}
								placeholder="Search by email"
								className="w-full rounded-md border border-accent bg-background px-3 py-2 text-sm outline-none"
							/>

							<div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
								<div className="space-y-3">
									{users.length > 0 ? (
										users.map((entry) => (
											<div
												key={entry.id}
												className="rounded border border-accent/30 p-4 space-y-3"
											>
												<div className="flex flex-wrap items-start justify-between gap-3">
													<div>
														<p className="font-medium">
															{entry.name || entry.email}
														</p>
														<p className="text-xs text-muted">{entry.email}</p>
														<p className="text-xs text-muted mt-1">
															Role:{" "}
															{Array.isArray(entry.role)
																? entry.role.join(", ")
																: entry.role || "user"}
															{entry.banned ? " · Banned" : " · Active"}
														</p>
													</div>
													<Button
														size="sm"
														variant="outline"
														className="w-full sm:w-auto"
														onPress={() => setSelectedUserId(entry.id)}
													>
														View sessions
													</Button>
												</div>
												<div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
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
										))
									) : (
										<p className="text-sm text-muted">
											No users matched your current search.
										</p>
									)}
								</div>

								<div className="rounded border border-accent/30 p-4 space-y-3">
									<div>
										<p className="font-medium">Active sessions</p>
										<p className="text-xs text-muted mt-1">
											{selectedUserId
												? "Review and revoke active browser sessions."
												: "Select a user to inspect sessions."}
										</p>
									</div>
									{selectedUserSessions.length > 0 ? (
										selectedUserSessions.map((session) => (
											<div
												key={session.token || session.id}
												className="rounded border border-accent/20 p-3 space-y-2"
											>
												<p className="text-xs text-muted">
													Created:{" "}
													{session.createdAt
														? formatDate(new Date(session.createdAt))
														: "Unknown"}
												</p>
												<p className="text-xs text-muted break-words">
													IP: {session.ipAddress || "Unknown"}
												</p>
												<p className="text-xs text-muted break-words">
													Agent: {session.userAgent || "Unknown"}
												</p>
												{session.token ? (
													<Button
														size="sm"
														variant="danger"
														className="w-full sm:w-auto"
														isPending={revokeSession.isPending}
														onPress={() =>
															revokeSession.mutate(
																{ sessionToken: session.token },
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
													>
														Revoke session
													</Button>
												) : null}
											</div>
										))
									) : (
										<p className="text-sm text-muted">
											{selectedUserId
												? "No active sessions were returned for this user."
												: "No user selected."}
										</p>
									)}
								</div>
							</div>
						</Card.Content>
					</Card>
				</div>
			</ScrollShadow>
		</div>
	);
};
