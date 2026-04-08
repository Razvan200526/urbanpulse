import { Header } from "@client/components/Header";
import { PageLoader } from "@client/components/PageLoader";
import { ScrollShadow, Separator } from "@heroui/react";
import { ProfileDangerZoneCard } from "./components/ProfileDangerZoneCard";
import { ProfileEditorCard } from "./components/ProfileEditorCard";
import { ProfileStatsSidebar } from "./components/ProfileStatsSidebar";
import { useProfilePageData } from "./hooks";

export const ProfilePage = () => {
	const { profile, isPending, offerCount } = useProfilePageData();

	if (isPending || !profile) {
		return <PageLoader />;
	}

	return (
		<div className="flex h-[calc(100dvh)] min-w-0 flex-col overflow-hidden bg-surface w-full">
			<Header title="Profile" />
			<Separator />
			<ScrollShadow className="flex-1 p-4 sm:p-6" size={10}>
				<div className="mx-auto max-w-6xl space-y-6">
					<div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(280px,0.9fr)]">
						<div className="space-y-6">
							<ProfileEditorCard profile={profile} />
						</div>

						<ProfileStatsSidebar profile={profile} offerCount={offerCount} />
					</div>

					<ProfileDangerZoneCard />
				</div>
			</ScrollShadow>
		</div>
	);
};
