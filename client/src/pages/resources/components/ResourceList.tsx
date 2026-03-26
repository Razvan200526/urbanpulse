import type { ResourceWithUsersType } from "../hooks";
import { ResourceCard } from "./card/ResourceCard";

export const ResourceList = ({
	resources,
}: {
	resources: ResourceWithUsersType[];
}) => {
	return (
		<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
			{resources.map((item) => (
				<ResourceCard key={item.resource.id} item={item} />
			))}
		</div>
	);
};
