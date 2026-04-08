import type { UserProfilePayload } from "@client/hooks/useProfileSettings";
import { Card } from "@heroui/react";
import { UserRoundCheck } from "lucide-react";
import { ProfileStatsCard } from "./ProfileStatsCard";

export const ProfileStatsSidebar = ({
	profile,
	offerCount,
}: {
	profile: UserProfilePayload;
	offerCount: number;
}) => {
	const successfulInteractions = profile.user.successfulInteractions ?? 0;

	return (
		<div className="space-y-4">
			<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
				<ProfileStatsCard
					label="Active offers"
					value={offerCount}
					description={`Offer${offerCount === 1 ? "" : "s"} currently listed from your account.`}
				/>

				<ProfileStatsCard
					label="Successful interactions"
					value={successfulInteractions}
					description={`Completed help interaction${successfulInteractions === 1 ? "" : "s"} recorded so far.`}
				/>

				<Card className="border border-border shadow-none">
					<Card.Content className="space-y-3 p-5">
						<div className="flex items-center gap-2 text-sm font-medium text-foreground">
							<UserRoundCheck className="size-4 text-accent" />
							Account role
						</div>
						<p className="text-2xl font-semibold capitalize text-foreground">
							{profile.user.role ?? "user"}
						</p>
						<p className="text-sm text-muted">
							This role reflects your current UrbanPulse permissions.
						</p>
					</Card.Content>
				</Card>
			</div>
		</div>
	);
};
