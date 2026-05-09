import { Button } from "@client/components/Button/Button";
import type { AdminUserSession } from "@client/hooks/useModeration";
import { formatDate } from "@shared/utils/formatDate";

export const SessionRow = ({
	session,
	isPending,
	onRevoke,
}: {
	session: AdminUserSession;
	isPending: boolean;
	onRevoke: (sessionToken: string) => void;
}) => (
	<div className="rounded border border-accent/20 bg-surface px-3 py-3">
		<div className="space-y-1">
			<p className="text-xs text-muted">
				Created:{" "}
				{session.createdAt
					? formatDate(new Date(session.createdAt))
					: "Unknown"}
			</p>
			<p className="break-all text-xs text-muted">
				IP: {session.ipAddress || "Unknown"}
			</p>
			<p className="break-all text-xs text-muted">
				Agent: {session.userAgent || "Unknown"}
			</p>
		</div>
		{session.token ? (
			<div className="mt-3">
				<Button
					size="sm"
					variant="danger"
					className="w-full sm:w-auto"
					isPending={isPending}
					onPress={() => onRevoke(session.token || "")}
				>
					Revoke session
				</Button>
			</div>
		) : null}
	</div>
);
