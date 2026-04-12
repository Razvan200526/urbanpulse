import { Button } from "@client/components/Button/Button";
import { ProgressChip } from "@client/components/chips/ProgressChip";
import {
	Dropdown,
	type DropdownItemDataType,
} from "@client/components/Dropdown";
import { normalizeAssetUrl } from "@client/utils/normalizeAssetUrl";
import {
	type PetAlertListItem,
	petAlertUploadStatusLabels,
} from "@client/utils/petAlerts";
import { Card, Chip, cn, Dropdown as HeroDropdown } from "@heroui/react";
import { PetAlertTypeEnum } from "@shared/types";
import { CheckCheck, MoreVerticalIcon, PawPrint, Trash2 } from "lucide-react";
import { useDeletePetAlert, useResolvePetAlert } from "../hooks";

export const PetAlertCard = ({
	currentUserId,
	item,
	canReviewMatches = false,
	onReviewMatches,
}: {
	currentUserId?: string;
	item: PetAlertListItem;
	canReviewMatches?: boolean;
	onReviewMatches?: (item: PetAlertListItem) => void;
}) => {
	const { mutateAsync: deletePetAlert } = useDeletePetAlert(
		currentUserId || "",
	);
	const { mutateAsync: resolvePetAlert } = useResolvePetAlert();

	const isOwn = currentUserId === item.alert.ownerUserId;
	const { alert, uploadStatus } = item;
	const isLost = alert.alertType === PetAlertTypeEnum.Lost;

	const dropdownItems: DropdownItemDataType[] = [
		{
			key: "resolve",
			label: "Mark as resolved",
			icon: <CheckCheck className="size-4 text-success" />,
			className:
				"bg-surface hover:bg-success-soft-hover transition-colors duration-150 ease-in",
			labelClassName: "text-success",
			onAction: async () => {
				await resolvePetAlert(alert.pulseId);
			},
		},
		{
			key: "delete",
			label: "Delete",
			icon: <Trash2 className="size-4 text-danger" />,
			className:
				"bg-surface hover:bg-danger-soft-hover transition-colors duration-150 ease-in",
			labelClassName: "text-danger",
			onAction: async () => {
				await deletePetAlert(alert.id);
			},
		},
	];

	return (
		<Card className="overflow-hidden border border-border bg-surface/60 shadow-none transition-all hover:border-accent/40">
			<Card.Header className="flex flex-col items-start gap-1 p-4">
				<div className="flex w-full items-center justify-between">
					<Card.Title className="w-full text-lg font-bold text-accent">
						<div className="w-full flex items-center justify-between">
							<div className="flex items-center justify-start gap-2">
								<p>
									{alert.color} {alert.petType}
								</p>
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

							<div className="flex items-center justify-end">
								<Dropdown
									trigger={
										<HeroDropdown.Trigger className="rounded-full p-2 hover:bg-accent-soft-hover transition-color duration-150 ease-in">
											<MoreVerticalIcon className="size-4 text-accent" />
										</HeroDropdown.Trigger>
									}
									items={dropdownItems.filter((item) => {
										if (item.key === "resolve" || item.key === "delete") {
											return isOwn;
										}
										if (item.key === "report") {
											return !isOwn;
										}
										return true;
									})}
								/>
							</div>
						</div>
					</Card.Title>
				</div>
				<Card.Description className="line-clamp-2 text-xs text-muted">
					{alert.aiDescriptor || "No description provided."}
				</Card.Description>
			</Card.Header>

			<Card.Content className="px-4 pb-4">
				<div className="flex flex-col gap-2 text-xs text-muted">
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
