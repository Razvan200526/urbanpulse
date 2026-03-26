import { Button } from "@client/components/Button/Button";
import { InputSearch } from "@client/components/input/InputSearch";
import { useAuth } from "@client/hooks/useAuth";
import { Filter } from "lucide-react";
import { useRetrieveResources } from "../hooks";
import { ResourceCard } from "./card/ResourceCard";
import { ResourceCardSkeleton } from "./card/ResourceCardSkeleton";

export const AllResourcesTab = () => {
	const { data: user } = useAuth();
	const { data: resources, isLoading } = useRetrieveResources(
		user?.user.id || "",
	);

	return (
		<div className="space-y-6">
			<div className="flex flex-col items-center justify-between sm:flex-row gap-4">
				<InputSearch className="w-full max-w-2xl" />
				<div className="flex gap-2">
					<Button variant="primary">
						<Filter className="h-4 w-4" />
						Filter
					</Button>
				</div>
			</div>

			{isLoading ? (
				<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
					{Array.from({ length: 8 }).map((_, i) => (
						// biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholders
						<ResourceCardSkeleton key={i} />
					))}
				</div>
			) : resources && resources.length > 0 ? (
				<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
					{resources.map((item) => (
						<ResourceCard key={item.resource.id} item={item} />
					))}
				</div>
			) : (
				<div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
					<p className="text-4xl">📦</p>
					<p className="text-lg font-semibold text-foreground">
						No resources yet
					</p>
					<p className="text-sm text-muted max-w-xs">
						Be the first to contribute a skill, item, or space to your
						community.
					</p>
				</div>
			)}
		</div>
	);
};
