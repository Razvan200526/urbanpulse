import { Button } from "@client/components/Button/Button";
import { ProgressChip } from "@client/components/chips/ProgressChip";
import { normalizeAssetUrl } from "@client/utils/normalizeAssetUrl";
import {
	type PetAlertListItem,
	petAlertUploadStatusLabels,
} from "@client/utils/petAlerts";
import { Card, Chip, cn } from "@heroui/react";
import { PetAlertTypeEnum } from "@shared/types";
import { MapPin, PawPrint } from "lucide-react";

export const PetAlertCard = ({
	item,
	canReviewMatches = false,
	onReviewMatches,
}: {
	item: PetAlertListItem;
	canReviewMatches?: boolean;
	onReviewMatches?: (item: PetAlertListItem) => void;
}) => {
	const { alert, uploadStatus } = item;
	const isLost = alert.alertType === PetAlertTypeEnum.Lost;

	return (
		<Card className="overflow-hidden border border-border bg-surface/60 shadow-none transition-all hover:border-accent/40">
			{alert.imageUrl && (
				<div className="relative h-48 w-full overflow-hidden">
					<img
						src={normalizeAssetUrl(alert.imageUrl)}
						alt={`${alert.color} ${alert.petType}`}
						className="h-full w-full object-cover"
					/>
					<div className="absolute top-3 left-3">
						{uploadStatus ? (
							<ProgressChip
								size="sm"
								status={uploadStatus}
								label={petAlertUploadStatusLabels[uploadStatus]}
							/>
						) : null}
					</div>
				</div>
			)}
			<Card.Header className="flex flex-col items-start gap-1 p-4">
				<div className="flex w-full items-center justify-between">
					<Card.Title className="text-lg font-bold text-accent">
						{alert.color} {alert.petType}
					</Card.Title>
					<div className="flex flex-wrap items-center justify-end gap-2">
						<Chip
							variant={isLost ? undefined : "primary"}
							className={cn(
								isLost
									? "bg-danger/30 text-danger border border-danger"
									: "bg-success/30 text-success border border-success",
								"py-1 rounded-full w-15 flex items-center justify-center",
							)}
							size="sm"
						>
							<Chip.Label className={cn("text-xs")}>
								{isLost ? "Lost" : "Found"}
							</Chip.Label>
						</Chip>
						{alert.breed && (
							<Chip
								size="sm"
								className="bg-surface-secondary text-accent rounded-full py-1 px-2 border border-accent"
							>
								{alert.breed}
							</Chip>
						)}
					</div>
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

				{canReviewMatches ? (
					<div className="mt-4 border-t border-border pt-4">
						<Button
							size="sm"
							className="w-full border border-border bg-surface text-foreground hover:border-accent hover:text-accent"
							startContent={<PawPrint className="size-4" />}
							onPress={() => onReviewMatches?.(item)}
						>
							Review matches
						</Button>
					</div>
				) : null}
			</Card.Content>
		</Card>
	);
};
