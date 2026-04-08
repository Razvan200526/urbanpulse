import { Button } from "@client/components/Button/Button";
import { AvailabilityChip } from "@client/components/chips/AvaiabilityChip";
import { H6 } from "@client/components/typography";
import { Avatar } from "@client/components/user/Avatar";
import { normalizeAssetUrl } from "@client/utils/normalizeAssetUrl";
import { Card, Separator } from "@heroui/react";
import { formatDate } from "@shared/utils/formatDate";
import { Clock3Icon, ImageIcon } from "lucide-react";
import { useState } from "react";
import type { ResourceWithUsersType } from "../../resourceResponses";
import { ResourceDetailsDrawer } from "./ResourceDetailsDrawer";

export const MySkillsCard = ({ item }: { item: ResourceWithUsersType }) => {
	const [isDrawerOpen, setIsDrawerOpen] = useState(false);
	const heroImage = item.resource.imageUrls[0];

	return (
		<Card className="overflow-hidden border border-accent shadow-none">
			<div className="aspect-[4/3] border-b border-accent/40 bg-surface-secondary">
				{heroImage ? (
					<img
						src={normalizeAssetUrl(heroImage)}
						alt={item.resource.name}
						className="h-full w-full object-cover"
					/>
				) : (
					<div className="flex h-full items-center justify-center text-muted">
						<div className="flex items-center gap-2 text-sm">
							<ImageIcon className="size-4" />
							<span>No photo added</span>
						</div>
					</div>
				)}
			</div>

			<Card.Header className="flex flex-col items-start gap-3">
				<div className="flex w-full items-start justify-between gap-3">
					<div className="min-w-0 space-y-1">
						<H6 className="truncate">{item.resource.name}</H6>
						<div className="flex items-center gap-2 text-xs text-muted">
							<Clock3Icon className="size-3" />
							<span>{formatDate(item.resource.createdAt)}</span>
						</div>
					</div>
					<AvailabilityChip status={item.resource.availability} />
				</div>
				<div className="flex items-center gap-3 text-sm text-muted">
					<Avatar user={item.author} />
					<span>Your listing</span>
				</div>
			</Card.Header>

			<Card.Content className="space-y-4">
				<p className="line-clamp-3 text-sm leading-relaxed text-muted">
					{item.resource.description || "No description provided yet."}
				</p>

				<div className="flex items-center justify-between gap-3 rounded border border-accent/30 bg-surface-secondary/60 px-3 py-2">
					<div>
						<p className="text-xs text-muted">Recent borrowers</p>
						<p className="text-sm font-medium text-foreground">
							{item.recentUsers.length}
						</p>
					</div>
					<div className="flex -space-x-2">
						{item.recentUsers.slice(0, 3).map((user, index) => (
							<Avatar key={`${user.id}:${index.toString()}`} user={user} />
						))}
					</div>
				</div>
			</Card.Content>

			<Separator />

			<Card.Footer className="flex items-center justify-end py-3">
				<Button variant="primary" onPress={() => setIsDrawerOpen(true)}>
					Details
				</Button>
			</Card.Footer>

			<ResourceDetailsDrawer
				item={item}
				author={item.author || undefined}
				isOpen={isDrawerOpen}
				onOpenChange={setIsDrawerOpen}
			/>
		</Card>
	);
};
