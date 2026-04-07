import { Button } from "@client/components/Button/Button";
import { AvailabilityChip } from "@client/components/chips/AvaiabilityChip";
import { H6 } from "@client/components/typography";
import { Avatar } from "@client/components/user/Avatar";
import { Card, Separator } from "@heroui/react";
import { formatDate } from "@shared/utils/formatDate";
import { MoreVertical, Star } from "lucide-react";
import { useState } from "react";
import type { ResourceWithUsersType } from "../../resourceResponses";
import { ResourceDetailsDrawer } from "./ResourceDetailsDrawer";

export const ResourceCard = ({ item }: { item: ResourceWithUsersType }) => {
	const { resource, recentUsers, author, reviewSummary } = item;
	const [isDrawerOpen, setIsDrawerOpen] = useState(false);
	const reviewText =
		reviewSummary.count > 0
			? `${(reviewSummary.averageRating ?? 0).toFixed(1)} (${reviewSummary.count} review${reviewSummary.count === 1 ? "" : "s"})`
			: "No reviews yet";

	return (
		<Card key={resource.id} className="border border-accent shadow-none">
			<Card.Header className="flex flex-row items-center justify-between">
				<H6 className="truncate">{resource.name}</H6>
				<Button size="sm" variant="ghost" isIconOnly radius="full">
					<MoreVertical className="size-4 text-accent" />
				</Button>
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
