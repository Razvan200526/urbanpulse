import { Header } from "@client/components/Header";
import { Avatar } from "@client/components/user/Avatar";
import { Button } from "@client/components/Button/Button";
import { useAuth } from "@client/hooks/useAuth";
import { useNotifications } from "@client/hooks/useNotifications";
import { useAcceptHelpOffer } from "@client/pages/map/hooks";
import {
	Card,
	Modal,
	ProgressCircle,
	ScrollShadow,
	Separator,
	Table,
	Tooltip,
} from "@heroui/react";
import { Bell, CheckCircle2, Info, XCircle } from "lucide-react";
import { useState } from "react";

function _summarizePayload(
	type: string,
	payload: Record<string, unknown> | null,
) {
	if (!payload || typeof payload !== "object") return "";
	if (type === "HERO_ALERT") {
		const t = payload.type as string | undefined;
		const d = payload.description as string | undefined;
		return [t && `Type: ${t}`, d].filter(Boolean).join(" · ") || "Nearby pulse";
	}
	if (type === "PULSE_RESPONSE") {
		const name = payload.responderName as string | undefined;
		const title = payload.pulseTitle as string | undefined;
		return `${name ?? "Someone"} offered help${title ? ` on “${title}”` : ""}.`;
	}
	if (type === "PULSE_RESPONSE_ACCEPTED") {
		const owner = payload.ownerName as string | undefined;
		const title = payload.pulseTitle as string | undefined;
		return `${owner ?? "Someone"} accepted your help${title ? ` for “${title}”` : ""}.`;
	}
	return "";
}

function labelForType(type: string): string {
	switch (type) {
		case "HERO_ALERT":
			return "Pulse nearby";
		case "PULSE_RESPONSE":
			return "Help offer";
		case "PULSE_RESPONSE_ACCEPTED":
			return "Help accepted";
		case "PULSE_CONFIRMED":
			return "Pulse confirmed";
		case "MESSAGE":
			return "Message";
		case "TRANSACTION":
			return "Borrow / lend";
		case "FEEDBACK":
			return "Feedback";
		default:
			return type;
	}
}

export const AlertsPage = () => {
	const { data: user } = useAuth();
	const { data: notifications, isPending } = useNotifications(user?.user.id);
	const { mutate: acceptHelp } = useAcceptHelpOffer();
	const [selectedPayload, setSelectedPayload] = useState<{
		type: string;
		payload: Record<string, unknown> | null;
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
									{notifications?.map((n) => (
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
													{labelForType(n.notification?.type || "")}
												</p>
											</Table.Cell>
											<Table.Cell>
												<div className="flex items-center justify-center">
													<Tooltip delay={0}>
														<Tooltip.Trigger>
															<Button
																isIconOnly
																variant="ghost"
																size="sm"
																radius="full"
																onPress={() =>
																	setSelectedPayload({
																		type: n.notification?.type || "",
																		payload:
																			(n.notification?.payload as Record<
																				string,
																				unknown
																			> | null) || null,
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
												</div>
											</Table.Cell>
											<Table.Cell>
												<div className="flex items-center justify-center gap-2">
													<Tooltip delay={0}>
														<Tooltip.Trigger>
															<Button
																isIconOnly
																variant="ghost"
																size="sm"
																radius="full"
																onPress={() => {
																	if (n.notification?.id) {
																		acceptHelp({
																			pulseId: "",
																			responseId: n.notification.id,
																		});
																	}
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
																onPress={() => {
																	if (n.notification?.id) {
																		acceptHelp({
																			pulseId: "",
																			responseId: n.notification.id,
																		});
																	}
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
											</Table.Cell>
										</Table.Row>
									))}
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
								{selectedPayload && labelForType(selectedPayload.type)}
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
