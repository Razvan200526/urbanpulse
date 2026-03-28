import { Button } from "@client/components/Button/Button";
import { Header } from "@client/components/Header";
import { useAuth } from "@client/hooks/useAuth";
import { useNotifications } from "@client/hooks/useNotifications";
import { useAcceptHelpOffer } from "@client/pages/map/hooks";
import { Card, Separator, Toast } from "@heroui/react";
import { formatDate } from "@shared/utils/formatDate";
import { Bell } from "lucide-react";
import { useState } from "react";

function summarizePayload(type: string, payload: Record<string, unknown> | null) {
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
	const acceptHelp = useAcceptHelpOffer();
	const [acceptedKeys, setAcceptedKeys] = useState(() => new Set<string>());

	return (
		<div className="flex flex-col h-full bg-surface overflow-auto">
			<Header title="Alerts" />
			<Separator />
			<div className="p-6 max-w-2xl mx-auto w-full space-y-4">
				<p className="text-sm text-muted">
					Recent notifications, including nearby pulses and responses to your
					requests.
				</p>
				{isPending && (
					<p className="text-sm text-muted">Loading…</p>
				)}
				{!isPending && (!notifications || notifications.length === 0) && (
					<Card className="border border-border shadow-none">
						<Card.Content className="p-8 flex flex-col items-center text-center gap-2">
							<Bell className="size-10 text-muted" />
							<p className="text-sm text-muted">No alerts yet.</p>
						</Card.Content>
					</Card>
				)}
				<ul className="space-y-2">
					{notifications?.map(
						(n: {
							id: string;
							type: string;
							payload: unknown;
							createdAt: Date | string;
							read: boolean;
						}) => {
							const payload =
								n.payload && typeof n.payload === "object"
									? (n.payload as Record<string, unknown>)
									: null;
							const summary = summarizePayload(n.type, payload);
							const pulseId =
								payload && "pulseId" in payload
									? String(payload.pulseId)
									: "";
							const responseId =
								payload && "responseId" in payload
									? String(payload.responseId)
									: "";
							const offerKey =
								pulseId && responseId
									? `${pulseId}:${responseId}`
									: "";
							const canAcceptHelp =
								n.type === "PULSE_RESPONSE" &&
								pulseId &&
								responseId &&
								!acceptedKeys.has(offerKey);
							return (
								<li key={n.id}>
									<Card
										className={`border border-border shadow-none ${n.read ? "opacity-70" : ""}`}
									>
										<Card.Content className="p-4">
											<div className="flex items-start justify-between gap-2">
												<span className="text-xs font-semibold uppercase tracking-wide text-accent">
													{labelForType(n.type)}
												</span>
												<span className="text-[11px] text-muted shrink-0">
													{formatDate(n.createdAt)}
												</span>
											</div>
											{summary ? (
												<p className="text-sm text-muted mt-2 leading-snug">
													{summary}
												</p>
											) : (
												<pre className="text-xs text-muted mt-2 whitespace-pre-wrap font-sans break-words">
													{JSON.stringify(n.payload, null, 2)}
												</pre>
											)}
											{canAcceptHelp && (
												<div className="mt-3 flex justify-end">
													<Button
														size="sm"
														variant="primary"
														isPending={acceptHelp.isPending}
														onPress={() =>
															acceptHelp.mutate(
																{ pulseId, responseId },
																{
																	onSuccess: () => {
																		setAcceptedKeys((prev) => {
																			const next = new Set(prev);
																			next.add(offerKey);
																			return next;
																		});
																		Toast.toast.success(
																			"Help offer accepted",
																		);
																	},
																	onError: (err) =>
																		Toast.toast.danger(
																			err instanceof Error
																				? err.message
																				: "Could not accept",
																		),
																},
															)
														}
													>
														Accept help
													</Button>
												</div>
											)}
										</Card.Content>
									</Card>
								</li>
							);
						},
					)}
				</ul>
			</div>
		</div>
	);
};
