import type { PetAlertListItem } from "@client/utils/petAlerts";
import { NoPetAlerts } from "./NoPetAlerts";
import { PetAlertCard } from "./PetAlertCard";
import { PetListSkeleton } from "./PetListSkeleton";
import { useAuth } from "@client/hooks/useAuth";

interface PetAlertListProps {
	items: PetAlertListItem[];
	isLoading: boolean;
	currentUserId?: string;
	onReviewMatches?: (item: PetAlertListItem) => void;
}

export const PetAlertList = ({
	items,
	isLoading,
	currentUserId,
	onReviewMatches,
}: PetAlertListProps) => {
	const { data: auth } = useAuth();
	if (isLoading && items.length === 0) {
		return <PetListSkeleton />;
	}

	if (items.length === 0) {
		return <NoPetAlerts />;
	}

	return (
		<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
			{items.map((item) => (
				<PetAlertCard
					currentUserId={auth?.user.id}
					key={item.requestId ?? item.alert.id}
					item={item}
					canReviewMatches={Boolean(
						currentUserId && item.alert.ownerUserId === currentUserId,
					)}
					onReviewMatches={onReviewMatches}
				/>
			))}
		</div>
	);
};
