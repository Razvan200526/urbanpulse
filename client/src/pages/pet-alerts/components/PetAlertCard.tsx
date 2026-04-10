import { normalizeAssetUrl } from "@client/utils/normalizeAssetUrl";
import { Card, Chip, cn } from "@heroui/react";
import { PetAlertTypeEnum } from "@shared/types";
import { MapPin } from "lucide-react";
import type { ClientPetAlert } from "@client/utils/petAlerts";

export const PetAlertCard = ({ alert }: { alert: ClientPetAlert }) => {
	const isLost = alert.alertType === PetAlertTypeEnum.Lost;

	return (
		<Card className="overflow-hidden border border-border bg-surface/60 shadow-none transition-all hover:border-accent/40">
			{alert.imageUrl && (
				<div className="relative h-48 w-full overflow-hidden">
					<img
						src={normalizeAssetUrl(alert.imageUrl)}
						alt={`${alert.color} ${alert.petType}`}
						className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
					/>
					<div className="absolute top-3 left-3">
						<Chip
							className={cn(
								isLost
									? "bg-danger/80 text-white border border-danger"
									: "bg-success/80 text-white border border-success",
								"py-1 rounded-full w-15 flex items-center justify-center",
							)}
							size="sm"
						>
							<Chip.Label className={cn("text-xs")}>
								{isLost ? "Lost" : "Found"}
							</Chip.Label>
						</Chip>
					</div>
				</div>
			)}
			<Card.Header className="flex flex-col items-start gap-1 p-4">
				<div className="flex w-full items-center justify-between">
					<Card.Title className="text-lg font-bold text-accent">
						{alert.color} {alert.petType}
					</Card.Title>
					{alert.breed && (
						<Chip
							size="sm"
							variant="soft"
							className="bg-surface-secondary text-accent rounded-full py-1 px-2 border border-accent"
						>
							{alert.breed}
						</Chip>
					)}
				</div>
				<Card.Description className="line-clamp-2 text-xs text-muted">
					{alert.aiDescriptor || "No description provided."}
				</Card.Description>
			</Card.Header>

			<Card.Content className="px-4 pb-4">
				<div className="flex flex-col gap-2 text-xs text-muted">
					<div className="flex items-center gap-2">
						<MapPin className="size-3 text-accent" />
						<span>Reported near your area</span>
					</div>
				</div>
			</Card.Content>
		</Card>
	);
};
