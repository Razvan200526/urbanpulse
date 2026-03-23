import { Button } from "@client/components/Button/Button";
import { H6 } from "@client/components/typography";
import { Avatar } from "@client/components/user/Avatar";
import { Card, Chip, Separator } from "@heroui/react";
import type { ResourceType } from "@server/db/schema";
import { MoreVertical, Star } from "lucide-react";

export const ResourceCard = ({ resource }: { resource: ResourceType }) => {
	return (
		<Card
			key={resource.id}
			className="border border-border-secondary shadow-none"
		>
			<Card.Header className="flex flex-row items-center justify-between">
				<H6>{resource.name}</H6>
				<Button size="sm" variant="ghost" isIconOnly radius="full">
					<MoreVertical className="size-4 text-accent" />
				</Button>
			</Card.Header>

			<Card.Content className="space-y-3">
				<div className="flex items-center justify-start gap-4">
					<Avatar />
					<p className="text-sm text-muted">Test Owner</p>
				</div>

				<div className="flex flex-wrap gap-2">
					<Chip variant="soft" color="accent" size="sm">
						<Chip.Label>{resource.availability}</Chip.Label>
					</Chip>
					{/*<Chip size="sm" variant="soft">
						{resource.}
					</Chip>*/}
				</div>

				<div className="flex items-center gap-1 mt-2">
					<Star className="h-3 w-3 text-warning fill-warning" />
					{/*<span className="text-xs font-medium">{resource.rating}</span>*/}
					<span className="text-xs text-foreground/30 ml-1">
						(120+ reviews)
					</span>
				</div>
			</Card.Content>

			<Separator />

			<Card.Footer className="flex justify-between items-center py-3">
				<div className="flex -space-x-2">
					{Array.from({ length: 3 }).map((_, i) => (
						// biome-ignore lint/suspicious/noArrayIndexKey: <only for test design>
						<Avatar key={i} />
					))}
				</div>
				<Button variant="primary">Details</Button>
			</Card.Footer>
		</Card>
	);
};
