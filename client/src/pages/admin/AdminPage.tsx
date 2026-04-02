import { Button } from "@client/components/Button/Button";
import { Header } from "@client/components/Header";
import { PageLoader } from "@client/components/PageLoader";
import { P } from "@client/components/typography";
import { useAdminOverview } from "@client/hooks/useAdminOverview";
import { useAdminReports, useReviewReport } from "@client/hooks/useModeration";
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

export const AdminPage = () => {
	const { data, isPending, error } = useAdminOverview();
	const { data: reports = [] } = useAdminReports();
	const reviewReport = useReviewReport();

	if (isPending) {
		return <PageLoader />;
	}

	if (error || !data) {
		return (
			<div className="flex flex-col h-[calc(100dvh)] bg-surface overflow-hidden">
				<Header title="Moderation" />
				<Separator />
				<div className="flex-1 p-8 flex items-center justify-center">
					<div className="flex flex-col space-y-4 items-center">
						<AlertCircleIcon className="size-20 text-danger" />
						<P>This page is restricted to administrators only.</P>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="flex flex-col h-[calc(100dvh)] bg-surface overflow-hidden">
			<Header title="Moderation" />
			<Separator />
			<ScrollShadow className="flex-1 p-6" size={10}>
				<div className="max-w-6xl mx-auto space-y-6">
					<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
						{metricCards.map((card) => {
							const Icon = card.icon;
							return (
								<Card
									key={card.key}
									className="border border-border shadow-none"
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
						<Card className="border border-border shadow-none">
							<Card.Header>
								<Card.Title>Recent Reports</Card.Title>
							</Card.Header>
							<Card.Content className="p-5 space-y-4">
								{data.recentReports.length > 0 ? (
									data.recentReports.map((report) => (
										<div
											key={report.id}
											className="rounded border border-border p-3"
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

						<Card className="border border-border shadow-none">
							<Card.Header>
								<Card.Title>Recent Pulses</Card.Title>
							</Card.Header>
							<Card.Content className="p-5 space-y-4">
								{data.recentPulses.map((pulse) => (
									<div
										key={pulse.id}
										className="rounded border border-border p-3"
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

						<Card className="border border-border shadow-none">
							<Card.Header>
								<Card.Title>Recent Resources</Card.Title>
							</Card.Header>
							<Card.Content className="p-5 space-y-4">
								{data.recentResources.map((resource) => (
									<div
										key={resource.id}
										className="rounded border border-border p-3"
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

					<Card className="border border-border shadow-none">
						<Card.Header>
							<Card.Title>Moderation Queue</Card.Title>
							<Card.Description>
								Review active reports and decide whether the linked pulse stays
								live, gets resolved, or gets dismissed.
							</Card.Description>
						</Card.Header>
						<Card.Content className="p-5 space-y-4">
							{reports.length > 0 ? (
								reports.map((report) => {
									const isPendingReport =
										report.status === ReportStatusEnum.Pending;

									return (
										<div
											key={report.id}
											className="rounded border border-border p-4 space-y-3"
										>
											<div className="flex flex-wrap items-start justify-between gap-3">
												<div className="space-y-1">
													<p className="font-medium">{report.reason}</p>
													<p className="text-xs text-muted">
														Reported by{" "}
														{report.reporter?.name ||
															report.reporter?.email ||
															"Unknown"}{" "}
														· {formatDate(new Date(report.createdAt))}
													</p>
													<p className="text-xs text-muted">
														Status: {report.status}
														{report.targetPulse
															? ` · Pulse: ${report.targetPulse.title} (${report.targetPulse.status})`
															: ""}
														{report.targetUser
															? ` · Target user: ${report.targetUser.name || report.targetUser.email}`
															: ""}
													</p>
												</div>
												{report.targetPulse?.isVerified && (
													<span className="rounded-full border border-success/30 px-2 py-1 text-[11px] uppercase tracking-wide text-success">
														Verified pulse
													</span>
												)}
											</div>
											{isPendingReport ? (
												<div className="flex flex-wrap gap-2">
													<Button
														size="sm"
														variant="danger"
														isPending={reviewReport.isPending}
														onPress={() =>
															reviewReport.mutate(
																{
																	reportId: report.id,
																	status: ReportStatusEnum.Resolved,
																	pulseStatus: report.targetPulse
																		? PulseStatusEnum.Dismissed
																		: undefined,
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
														Resolve
														{report.targetPulse ? " and dismiss pulse" : ""}
													</Button>
													<Button
														size="sm"
														variant="outline"
														isPending={reviewReport.isPending}
														onPress={() =>
															reviewReport.mutate(
																{
																	reportId: report.id,
																	status: ReportStatusEnum.Dismissed,
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
													{report.targetPulse && (
														<Button
															size="sm"
															variant="primary"
															isPending={reviewReport.isPending}
															onPress={() =>
																reviewReport.mutate(
																	{
																		reportId: report.id,
																		status: ReportStatusEnum.Resolved,
																		pulseStatus: PulseStatusEnum.Resolved,
																	},
																	{
																		onSuccess: () =>
																			Toast.toast.success(
																				"Report resolved and pulse kept visible",
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
															Resolve and keep pulse
														</Button>
													)}
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
				</div>
			</ScrollShadow>
		</div>
	);
};
