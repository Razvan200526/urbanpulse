import { Button } from "@client/components/Button/Button";
import { Dropdown } from "@client/components/Dropdown";
import {
	InputSearch,
	type InputSearchRefType,
} from "@client/components/input/InputSearch";
import { Dropdown as HeroDropdown } from "@heroui/react";
import type { FilterResourceType } from "@shared/types";
import { Filter, PlusSquareIcon } from "lucide-react";
import { useDeferredValue, useMemo, useRef, useState } from "react";
import { useMyResources } from "../hooks";
import { MySkillsCard } from "./card/MySkillsCard";
import { ResourceCardSkeleton } from "./card/ResourceCardSkeleton";
import { FilterDropdownItems } from "./utils/FilterDropdownItems";

export const MySkillsTab = ({
	onUploadClick,
}: {
	onUploadClick: () => void;
}) => {
	const [availabilityFilter, setAvailabilityFilter] =
		useState<FilterResourceType>("All");
	const [searchTerm, setSearchTerm] = useState("");
	const searchInputRef = useRef<InputSearchRefType>(null);
	const deferredSearchTerm = useDeferredValue(searchTerm.trim().toLowerCase());
	const { data: resources = [], isLoading } =
		useMyResources(availabilityFilter);
	const filterItems = FilterDropdownItems("availability").map((item) => ({
		...item,
		onAction: () => setAvailabilityFilter(item.key as FilterResourceType),
	}));

	const filteredResources = useMemo(() => {
		if (!deferredSearchTerm) {
			return resources;
		}

		return resources.filter((item) => {
			const haystack = [item.resource.name, item.resource.description || ""]
				.join(" ")
				.toLowerCase();

			return haystack.includes(deferredSearchTerm);
		});
	}, [deferredSearchTerm, resources]);

	const hasFilters =
		availabilityFilter !== "All" || deferredSearchTerm.length > 0;
	const isEmptyLibrary = resources.length === 0;

	const emptyState = isEmptyLibrary ? (
		<div className="flex flex-col items-center justify-center rounded border border-dashed border-border bg-surface-secondary/30 px-6 py-16 text-center">
			<p className="text-lg font-semibold text-foreground">
				You have not shared any skills yet
			</p>
			<p className="mt-2 max-w-md text-sm text-muted">
				Add the tools, spaces, or help you can offer so neighbours can discover
				and request them when they need support.
			</p>
			<Button
				className="mt-5"
				variant="primary"
				startContent={<PlusSquareIcon className="size-4" />}
				onPress={onUploadClick}
			>
				Upload your first listing
			</Button>
		</div>
	) : (
		<div className="flex flex-col items-center justify-center rounded border border-dashed border-border bg-surface-secondary/30 px-6 py-16 text-center">
			<p className="text-lg font-semibold text-foreground">
				No listings match the current filters
			</p>
			<p className="mt-2 max-w-md text-sm text-muted">
				Try a broader search or switch the availability filter to see more of
				your uploads.
			</p>
			{hasFilters ? (
				<Button
					className="mt-5"
					variant="outline"
					onPress={() => {
						setSearchTerm("");
						setAvailabilityFilter("All");
						searchInputRef.current?.setValue("");
					}}
				>
					Clear filters
				</Button>
			) : null}
		</div>
	);

	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-3 lg:flex-row lg:items-center">
				<InputSearch
					ref={searchInputRef}
					className="min-w-0 flex-1"
					placeholder="Search your uploads by name or description..."
					onChange={(value) => setSearchTerm(String(value))}
				/>
				<div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
					<Button
						variant="primary"
						className="w-full sm:w-auto"
						startContent={<PlusSquareIcon className="size-4" />}
						onPress={onUploadClick}
					>
						Upload
					</Button>
					<Dropdown
						trigger={
							<HeroDropdown.Trigger className="flex justify-center rounded border border-accent bg-surface px-3 py-2 text-accent shadow-sm">
								<Filter className="size-4" />
							</HeroDropdown.Trigger>
						}
						items={filterItems}
					/>
				</div>
			</div>

			<div className="flex items-center justify-between gap-3">
				<p className="text-sm font-medium text-foreground">
					Your shared library
				</p>
				<p className="text-xs text-muted">
					{filteredResources.length} of {resources.length} listing
					{resources.length === 1 ? "" : "s"}
				</p>
			</div>

			{isLoading ? (
				<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
					{Array.from({ length: 4 }).map((_, i) => (
						// biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholders
						<ResourceCardSkeleton key={i} />
					))}
				</div>
			) : filteredResources.length > 0 ? (
				<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
					{filteredResources.map((item) => (
						<MySkillsCard key={item.resource.id} item={item} />
					))}
				</div>
			) : (
				emptyState
			)}
		</div>
	);
};
