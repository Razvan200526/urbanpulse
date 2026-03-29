import { Button } from "@client/components/Button/Button";
import { Header } from "@client/components/Header";
import { Avatar } from "@client/components/user/Avatar";
import { useAuth } from "@client/hooks/useAuth";
import { useNotifications } from "@client/hooks/useNotifications";
import { useAcceptHelpOffer } from "@client/pages/map/hooks";
import { Card, ProgressCircle, Separator, Table, Toast } from "@heroui/react";
import { formatDate } from "@shared/utils/formatDate";
import { Bell } from "lucide-react";
import { useState } from "react";

function summarizePayload(
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
	const acceptHelp = useAcceptHelpOffer();
	const [acceptedKeys, setAcceptedKeys] = useState(() => new Set<string>());

	if (isPending) {
		return (
			<ProgressCircle
				isIndeterminate
				className="h-screen flex items-center justify-center"
			/>
		);
	}
	return (
		<div className="flex flex-col h-full bg-surface">
			<Header title="Alerts" />
			<Separator />
			<div className="p-6 max-w-2xl mx-auto w-full space-y-4 flex flex-col items-start justify-start">
				<p className="text-sm text-muted">
					Recent notifications, including nearby pulses and responses to your
					requests.
				</p>
				{!isPending && (!notifications || notifications.length === 0) && (
					<Card className="border border-border shadow-none">
						<Card.Content className="p-8 flex flex-col items-center text-center gap-2">
							<Bell className="size-10 text-muted" />
							<p className="text-sm text-muted">No alerts yet.</p>
						</Card.Content>
					</Card>
				)}
				<div className="w-full flex flex-row items-start justify-start">
					<Table variant="secondary">
						<Table.ScrollContainer>
							<Table.Content aria-label="alerts-table">
								<Table.Header>
									<Table.Column>User</Table.Column>
									<Table.Column>Type</Table.Column>
								</Table.Header>
								<Table.Body>
									{notifications?.map((n) => (
										<Table.Row key={n.notification?.id}>
											<Table.Cell className="flex items-center justify-start gap-2">
												{n.user && <Avatar user={n.user} />}
												<p className="text-sm text-accent"> {n.user?.name}</p>
											</Table.Cell>
											<Table.Cell>{n.notification?.type}</Table.Cell>
										</Table.Row>
									))}
								</Table.Body>
							</Table.Content>
						</Table.ScrollContainer>
					</Table>
				</div>
			</div>
		</div>
	);
};
