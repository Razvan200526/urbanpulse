import { Button } from "@client/components/Button/Button";
import { AvailabilityChip } from "@client/components/chips/AvaiabilityChip";
import {
	Dropdown,
	type DropdownItemDataType,
} from "@client/components/Dropdown";
import { H6 } from "@client/components/typography";
import { Avatar } from "@client/components/user/Avatar";
import { Card, Separator } from "@heroui/react";
import { formatDate } from "@shared/utils/formatDate";
import { EditIcon, MoreVertical, Star, Trash2Icon } from "lucide-react";
import { useState } from "react";
import { useDeleteResource } from "../../hooks";
import type { ResourceWithUsersType } from "../../resourceResponses";
import { ResourceDetailsDrawer } from "./ResourceDetailsDrawer";

export const ResourceCard = ({
	item,
	isOwner,
}: {
	item: ResourceWithUsersType;
	isOwner: boolean;
}) => {
	const { mutateAsync: deleteResource } = useDeleteResource();
	const { resource, recentUsers, author, reviewSummary } = item;

	const dropdownItems: DropdownItemDataType[] = [
		{
			key: "edit",
			label: "Edit",
			icon: <EditIcon className="size-4 text-accent" />,
			className: "text-accent hover:bg-accent/10",
			labelClassName: "text-accent",
		},
		...(isOwner
			? [
					{
						key: "delete",
						label: "Delete",
						icon: <Trash2Icon className="size-4 text-danger" />,
						onAction: async () => {
							await deleteResource(resource.id);
						},
						className: "text-danger hover:bg-danger/10",
						labelClassName: "text-danger",
					},
				]
			: []),
	];
	const [isDrawerOpen, setIsDrawerOpen] = useState(false);
	const reviewText =
		reviewSummary.count > 0
			? `${(reviewSummary.averageRating ?? 0).toFixed(1)} (${reviewSummary.count} review${reviewSummary.count === 1 ? "" : "s"})`
			: "No reviews yet";

	return (
		<Card key={resource.id} className="border border-accent shadow-none">
			<Card.Header className="flex flex-row items-center justify-between">
				<H6 className="truncate">{resource.name}</H6>
				<Dropdown
					trigger={
						<div className="rounded-full hover:bg-accent/10 p-2 transition-colors duration-150 ease-out">
							<MoreVertical className="size-4 text-accent" />
						</div>
					}
					items={dropdownItems}
				/>
			</Card.Header>

			<Card.Content className="space-y-3">
				<div className="flex items-center justify-start gap-4">
					<Avatar user={author} />
					<p className="text-sm text-muted"> {author?.name}</p>
				</div>

				<div className="flex flex-wrap gap-2 items-center">
					<AvailabilityChip status={resource.availability} />
					<p className="text-muted text-xs">{formatDate(resource.createdAt)}</p>
				</div>

				<div className="flex items-center gap-1 mt-2">
					<Star
						className={`h-3 w-3 text-warning ${reviewSummary.count > 0 ? "fill-warning" : ""}`}
					/>
					<span className="text-xs text-foreground/30 ml-1">{reviewText}</span>
				</div>
			</Card.Content>

			<Separator />

			<Card.Footer className="flex justify-between items-center py-3">
				<div className="flex -space-x-2">
					{recentUsers?.slice(0, 3).map((user, index) => (
						<Avatar key={`${user.id}:${index.toString()}`} user={user} />
					))}
				</div>
				<Button variant="primary" onPress={() => setIsDrawerOpen(true)}>
					Details
				</Button>
			</Card.Footer>

			<ResourceDetailsDrawer
				item={item}
				author={author || undefined}
				isOpen={isDrawerOpen}
				onOpenChange={setIsDrawerOpen}
			/>
		</Card>
	);
};
