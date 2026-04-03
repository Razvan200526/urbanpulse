import { Dropdown } from "@client/components/Dropdown";
import { InputSearch } from "@client/components/input/InputSearch";
import type { FilterResourceType } from "@shared/types";
import { Filter } from "lucide-react";
import { useDeferredValue, useMemo, useState } from "react";
import { useFilterResources } from "../hooks";
import { ResourceCard } from "./card/ResourceCard";
import { ResourceCardSkeleton } from "./card/ResourceCardSkeleton";
import { NoResources } from "./NoResources";
import { FilterDropdownItems } from "./utils/FilterDropdownItems";

export const AllResourcesTab = () => {
	const [availabilityFilter, setAvailabilityFilter] =
		useState<FilterResourceType>("All");
	const [searchTerm, setSearchTerm] = useState("");
	const deferredSearchTerm = useDeferredValue(searchTerm.trim().toLowerCase());
	const { data: resources = [], isLoading } =
		useFilterResources(availabilityFilter);
	const filterItems = FilterDropdownItems("availability").map((item) => ({
		...item,
		onAction: () => setAvailabilityFilter(item.key as FilterResourceType),
	}));

	const filteredResources = useMemo(() => {
		if (!deferredSearchTerm) {
			return resources;
		}

		return resources.filter((item) => {
			const haystack = [
				item.resource.name,
				item.resource.description || "",
				item.author?.name || "",
			]
				.join(" ")
				.toLowerCase();

			return haystack.includes(deferredSearchTerm);
		});
	}, [deferredSearchTerm, resources]);

	return (
		<div className="space-y-6">
			<div className="flex items-center gap-3">
				<InputSearch
					className="min-w-0 flex-1"
					placeholder="Search resources, descriptions, or neighbours..."
					onChange={(value) => setSearchTerm(String(value))}
				/>
				<div className="shrink-0">
					<Dropdown
						trigger={
							<div className="rounded-full bg-accent p-2 text-white shadow-sm">
								<Filter className="size-4" />
							</div>
						}
						items={filterItems}
					/>
				</div>
			</div>

			{isLoading ? (
				<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
					{Array.from({ length: 8 }).map((_, i) => (
						// biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholders
						<ResourceCardSkeleton key={i} />
					))}
				</div>
			) : filteredResources.length > 0 ? (
				<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
					{filteredResources.map((item) => (
						<ResourceCard key={item.resource.id} item={item} />
					))}
				</div>
			) : (
				<NoResources />
			)}
		</div>
	);
};
