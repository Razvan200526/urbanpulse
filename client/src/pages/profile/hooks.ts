import { useUserProfile } from "@client/hooks/useProfileSettings";
import { useFilterResources } from "@client/pages/resources/hooks";
import { useMemo } from "react";

export const useProfilePageData = () => {
	const { data: profile, isPending } = useUserProfile();
	const { data: resources } = useFilterResources("All");

	const offerCount = useMemo(() => {
		if (!profile) {
			return 0;
		}

		return (resources ?? []).filter(
			(item) => item.resource.userId === profile.user.id,
		).length;
	}, [profile, resources]);

	return {
		profile,
		isPending,
		offerCount,
	};
};
