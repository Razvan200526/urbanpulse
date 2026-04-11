import { PetMatchStatusEnum } from "@shared/types";
import {
	type PetMatchActionResponse,
	type PetMatchWorkflowItem,
	petMatchActionResponseSchema,
	petMatchWorkflowItemSchema,
	petMatchWorkflowListSchema,
} from "@shared/validators/pet-matches/isPetMatchWorkflowValid";

export type { PetMatchActionResponse, PetMatchWorkflowItem };
export {
	petMatchActionResponseSchema,
	petMatchWorkflowItemSchema,
	petMatchWorkflowListSchema,
};

export const petMatchStatusLabels: Record<PetMatchStatusEnum, string> = {
	[PetMatchStatusEnum.PendingReview]: "Possible match",
	[PetMatchStatusEnum.OwnerInterested]: "Waiting for finder",
	[PetMatchStatusEnum.OwnerDismissed]: "Dismissed",
	[PetMatchStatusEnum.FinderAccepted]: "Chat ready",
	[PetMatchStatusEnum.FinderDeclined]: "Declined",
};

export const isPetMatchAwaitingOwnerReview = (item: PetMatchWorkflowItem) =>
	item.viewerRole === "lost_owner" &&
	item.petMatch.status === PetMatchStatusEnum.PendingReview;

export const isPetMatchAwaitingFinderReview = (item: PetMatchWorkflowItem) =>
	item.viewerRole === "finder" &&
	item.petMatch.status === PetMatchStatusEnum.OwnerInterested;

export const isPetMatchChatReady = (item: PetMatchWorkflowItem) =>
	item.petMatch.status === PetMatchStatusEnum.FinderAccepted;

export const formatPetMatchPercent = (value: number) =>
	`${Math.round(value * 100)}%`;
