import { Button } from "@client/components/Button/Button";
import { InputSearch } from "@client/components/input/InputSearch";
import { useAuth } from "@client/hooks/useAuth";
import { Filter } from "lucide-react";
import { useDeferredValue, useMemo, useState } from "react";
import { useRetrieveResources } from "../hooks";
import { ResourceCard } from "./card/ResourceCard";
import { ResourceCardSkeleton } from "./card/ResourceCardSkeleton";
import { NoResources } from "./NoResources";

export const AllResourcesTab = () => {
	const { data: user } = useAuth();
	const { data: resources, isLoading } = useRetrieveResources(
		user?.user.id || "",
	);
	const [searchTerm, setSearchTerm] = useState("");
	const [availabilityFilter, setAvailabilityFilter] = useState<
		"All" | "Available" | "Unavailable" | "Currently Unavailable"
	>("All");
	const deferredSearchTerm = useDeferredValue(searchTerm.trim().toLowerCase());

	const filteredResources = useMemo(() => {
		return (resources ?? []).filter((item) => {
			const matchesSearch =
				deferredSearchTerm.length === 0 ||
				[
					item.resource.name,
					item.resource.description || "",
					item.author?.name || "",
				]
					.join(" ")
					.toLowerCase()
					.includes(deferredSearchTerm);

			const matchesAvailability =
				availabilityFilter === "All" ||
				item.resource.availability === availabilityFilter;

			return matchesSearch && matchesAvailability;
		});
	}, [availabilityFilter, deferredSearchTerm, resources]);

	return (
		<div className="space-y-6">
			<div className="flex flex-col items-center justify-between sm:flex-row gap-4">
				<InputSearch
					className="w-full max-w-2xl"
					placeholder="Search resources, descriptions, or neighbours..."
					onChange={(value) => setSearchTerm(String(value))}
				/>
				<div className="flex gap-2">
					<Button
						variant={availabilityFilter === "All" ? "primary" : "outline"}
						onPress={() => setAvailabilityFilter("All")}
					>
						<Filter className="h-4 w-4" />
						All
					</Button>
					<Button
						variant={availabilityFilter === "Available" ? "primary" : "outline"}
						onPress={() => setAvailabilityFilter("Available")}
					>
						Available
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
