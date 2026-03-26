import { Button } from "@client/components/Button/Button";
import { AvailabilityChip } from "@client/components/chips/AvaiabilityChip";
import { H6 } from "@client/components/typography";
import { Avatar } from "@client/components/user/Avatar";
import type { ClientUserType } from "@client/utils/types";
import { Card, Separator } from "@heroui/react";
import { MoreVertical, Star } from "lucide-react";
import { useGetResourceAuthor, type ResourceWithUsersType } from "../../hooks";
import { formatDate } from "@shared/utils/formatDate";
import { useState } from "react";
import { ResourceDetailsDrawer } from "./ResourceDetailsDrawer";

export const ResourceCard = ({ item }: { item: ResourceWithUsersType }) => {
	const { resource, recentUsers } = item;
	const { data: author } = useGetResourceAuthor(resource.id);
	const [isDrawerOpen, setIsDrawerOpen] = useState(false);

	return (
		<Card
			key={resource.id}
			className="border border-border-secondary shadow-none"
		>
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
					<Star className="h-3 w-3 text-warning fill-warning" />
					<span className="text-xs text-foreground/30 ml-1">
						(120+ reviews)
					</span>
				</div>
			</Card.Content>

			<Separator />

			<Card.Footer className="flex justify-between items-center py-3">
				<div className="flex -space-x-2">
					{recentUsers?.slice(0, 3).map((user) => (
						<Avatar key={user.id} user={user as ClientUserType} />
					))}
				</div>
				<Button variant="primary" onPress={() => setIsDrawerOpen(true)}>
					Details
				</Button>
			</Card.Footer>

			<ResourceDetailsDrawer
				item={item}
				author={author}
				isOpen={isDrawerOpen}
				onOpenChange={setIsDrawerOpen}
			/>
		</Card>
	);
};
