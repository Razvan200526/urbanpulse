import { Button } from "@client/components/Button/Button";
import { useAuth } from "@client/hooks/useAuth";
import { PlusSquareIcon } from "lucide-react";
import { useRetrieveResources } from "../hooks";
import { ResourceCard } from "./card/ResourceCard";
import { ResourceCardSkeleton } from "./card/ResourceCardSkeleton";

export const MySkillsTab = ({
	onUploadClick,
}: {
	onUploadClick: () => void;
}) => {
	const { data: user } = useAuth();
	const { data: resources, isLoading } = useRetrieveResources(
		user?.user.id || "",
	);

	const myResources = resources?.filter(
		(r) => r.resource.userId === user?.user.id,
	);

	return (
		<div className="space-y-6">
			{isLoading ? (
				<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
					{Array.from({ length: 4 }).map((_, i) => (
						// biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholders
						<ResourceCardSkeleton key={i} />
					))}
				</div>
			) : myResources && myResources.length > 0 ? (
				<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
					{myResources.map((item) => (
						<ResourceCard key={item.resource.id} item={item} />
					))}
				</div>
			) : (
				<div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
					<p className="text-4xl">🛠️</p>
					<p className="text-lg font-semibold text-foreground">
						You haven't added any skills yet
					</p>
					<p className="text-sm text-muted max-w-sm mb-2">
						Offer your skills, tools, or spaces to the community. You can manage
						their availability at any time.
					</p>
					<Button
						variant="primary"
						startContent={<PlusSquareIcon className="size-4" />}
						onPress={onUploadClick}
					>
						Offer a Skill or Resource
					</Button>
				</div>
			)}
		</div>
	);
};
