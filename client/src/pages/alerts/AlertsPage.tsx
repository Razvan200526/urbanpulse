import { Button } from "@client/components/Button/Button";
import { Header } from "@client/components/Header";
import { Avatar } from "@client/components/user/Avatar";
import { useAuth } from "@client/hooks/useAuth";
import { useNotifications } from "@client/hooks/useNotifications";
import {
	useAcceptHelpOffer,
	useRejectHelpOffer,
} from "@client/pages/map/hooks";
import {
	getPulseResponseActionPayload,
	labelForNotificationType,
	type NotificationPayload,
	summarizeNotificationPayload,
} from "@client/utils/notifications";
import {
	Card,
	Modal,
	ProgressCircle,
	ScrollShadow,
	Separator,
	Table,
	Toast,
	Tooltip,
} from "@heroui/react";
import { Bell, CheckCircle2, Info, XCircle } from "lucide-react";
import { useState } from "react";

export const AlertsPage = () => {
	const { data: user } = useAuth();
	const { data: notifications, isPending } = useNotifications(user?.user.id);
	const acceptHelp = useAcceptHelpOffer();
	const rejectHelp = useRejectHelpOffer();
	const [selectedPayload, setSelectedPayload] = useState<{
		type: string;
		payload: NotificationPayload;
	} | null>(null);

	if (isPending) {
		return (
			<ProgressCircle
				isIndeterminate
				className="h-screen flex items-center justify-center"
			/>
		);
	}

	return (
		<div className="flex flex-col w-full h-[calc(100dvh)] bg-surface">
			<Header title="Alerts" />
			<div className="m-4 p-4 flex flex-col items-center justify-start rounded border flex-1 min-h-0">
				{!isPending && (!notifications || notifications.length === 0) && (
					<Card className="border border-border shadow-none">
						<Card.Content className="p-8 flex flex-col items-center text-center gap-2">
							<Bell className="size-10 text-muted" />
							<p className="text-sm text-muted">No alerts yet.</p>
						</Card.Content>
					</Card>
				)}
				<ScrollShadow
					size={8}
					hideScrollBar
					className="w-full max-h-full flex flex-col items-start justify-start overflow-y-auto"
				>
					<Table variant="primary" className="bg-accent">
						<Table.ScrollContainer>
							<Table.Content aria-label="alerts-table">
								<Table.Header className="rounded bg-accent">
									<Table.Column className="text-xs text-white">
										User
									</Table.Column>
									<Table.Column className="text-xs text-white">
										Type
									</Table.Column>
									<Table.Column className="text-xs text-white text-center">
										Details
									</Table.Column>
									<Table.Column className="text-xs text-white text-center">
										Actions
									</Table.Column>
								</Table.Header>
								<Table.Body>
									{notifications?.map((n) => {
										const notificationType = n.notification?.type || "";
										const notificationPayload = n.notification?.payload ?? null;
										const pulseResponsePayload = getPulseResponseActionPayload(
											notificationType === "PULSE_RESPONSE"
												? notificationPayload
												: null,
										);
										const isActionPending =
											acceptHelp.isPending || rejectHelp.isPending;

										return (
											<Table.Row key={n.notification?.id} className="rounded">
												<Table.Cell>
													<div className="flex items-center justify-start gap-3">
														{n.user && <Avatar user={n.user} />}
														<div className="flex flex-col">
															<p className="text-sm font-medium text-foreground">
																{n.user?.name}
															</p>
															<p className="text-xs text-muted">
																{n.user?.email}
															</p>
														</div>
													</div>
												</Table.Cell>
												<Table.Cell>
													<p className="text-sm">
														{labelForNotificationType(notificationType)}
													</p>
												</Table.Cell>
												<Table.Cell>
													<div className="flex items-center justify-center">
														<div className="flex items-center gap-2">
															<Tooltip delay={0}>
																<Tooltip.Trigger>
																	<Button
																		isIconOnly
																		variant="ghost"
																		size="sm"
																		radius="full"
																		onPress={() =>
																			setSelectedPayload({
																				type: notificationType,
																				payload: notificationPayload,
																			})
																		}
																	>
																		<Info className="size-4 text-accent" />
																	</Button>
																</Tooltip.Trigger>
																<Tooltip.Content className="rounded-full">
																	View details
																</Tooltip.Content>
															</Tooltip>
															<p className="max-w-72 text-xs text-muted text-left">
																{summarizeNotificationPayload(
																	notificationType,
																	notificationPayload,
																) ||
																	"Open the details modal to inspect the full alert."}
															</p>
														</div>
													</div>
												</Table.Cell>
												<Table.Cell>
													{pulseResponsePayload ? (
														<div className="flex items-center justify-center gap-2">
															<Tooltip delay={0}>
																<Tooltip.Trigger>
																	<Button
																		isIconOnly
																		variant="ghost"
																		size="sm"
																		radius="full"
																		isDisabled={isActionPending}
																		onPress={() => {
																			if (!pulseResponsePayload) {
																				return;
																			}
																			acceptHelp.mutate(pulseResponsePayload, {
																				onSuccess: () => {
																					Toast.toast.success(
																						"Help offer accepted",
																					);
																				},
																				onError: (error: Error) => {
																					Toast.toast.danger(
																						error instanceof Error
																							? error.message
																							: "Could not accept offer",
																					);
																				},
																			});
																		}}
																	>
																		<CheckCircle2 className="size-4 text-success" />
																	</Button>
																</Tooltip.Trigger>
																<Tooltip.Content className="rounded-full">
																	Accept
																</Tooltip.Content>
															</Tooltip>
															<Tooltip delay={0}>
																<Tooltip.Trigger>
																	<Button
																		isIconOnly
																		variant="ghost"
																		size="sm"
																		radius="full"
																		isDisabled={isActionPending}
																		onPress={() => {
																			if (!pulseResponsePayload) {
																				return;
																			}
																			rejectHelp.mutate(pulseResponsePayload, {
																				onSuccess: () => {
																					Toast.toast.success(
																						"Help offer rejected",
																					);
																				},
																				onError: (error: Error) => {
																					Toast.toast.danger(
																						error instanceof Error
																							? error.message
																							: "Could not reject offer",
																					);
																				},
																			});
																		}}
																	>
																		<XCircle className="size-4 text-danger" />
																	</Button>
																</Tooltip.Trigger>
																<Tooltip.Content className="rounded-full">
																	Reject
																</Tooltip.Content>
															</Tooltip>
														</div>
													) : (
														<span className="text-xs text-muted">
															No quick action
														</span>
													)}
												</Table.Cell>
											</Table.Row>
										);
									})}
								</Table.Body>
							</Table.Content>
						</Table.ScrollContainer>
					</Table>
				</ScrollShadow>
			</div>

			{/* Payload Details Modal */}
			<Modal
				isOpen={selectedPayload !== null}
				onOpenChange={(open) => {
					if (!open) setSelectedPayload(null);
				}}
			>
				<Modal.Backdrop />
				<Modal.Container>
					<Modal.Dialog className="border border-border">
						<Modal.Header>
							<Modal.Heading>
								{selectedPayload &&
									labelForNotificationType(selectedPayload.type)}
								{" - Details"}
							</Modal.Heading>
						</Modal.Header>
						<Separator />
						<Modal.Body>
							{selectedPayload?.payload ? (
								<div className="flex flex-col gap-3">
									{Object.entries(selectedPayload.payload).map(
										([key, value]) => (
											<div
												key={key}
												className="bg-surface-secondary/30 rounded border border-border p-3"
											>
												<p className="text-xs font-semibold text-accent uppercase tracking-wider mb-1">
													{key.replace(/([A-Z])/g, " $1").trim()}
												</p>
												<p className="text-sm text-foreground wrap-break-word">
													{typeof value === "string"
														? value
														: JSON.stringify(value, null, 2)}
												</p>
											</div>
										),
									)}
								</div>
							) : (
								<p className="text-sm text-muted">No details available</p>
							)}
						</Modal.Body>
						<Separator />
						<Modal.Footer>
							<Button
								variant="primary"
								onPress={() => setSelectedPayload(null)}
							>
								Close
							</Button>
						</Modal.Footer>
					</Modal.Dialog>
				</Modal.Container>
			</Modal>
		</div>
	);
};
