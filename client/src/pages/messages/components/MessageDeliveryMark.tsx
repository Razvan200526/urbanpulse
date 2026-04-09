import { Check, CheckCheck } from "lucide-react";
import type { MessageDeliveryStatus } from "../hooks";

export const MessageDeliveryMark = ({
	status,
}: {
	status: MessageDeliveryStatus;
}) => {
	const label =
		status === "read"
			? "Read"
			: status === "delivered"
				? "Delivered"
				: "Sent, not delivered yet";
	const Icon = status === "sent" ? Check : CheckCheck;

	return (
		<span
			title={label}
			role="img"
			aria-label={label}
			className={status === "read" ? "text-secondary-text" : "opacity-80"}
		>
			<Icon className="size-3.5" aria-hidden="true" />
		</span>
	);
};
