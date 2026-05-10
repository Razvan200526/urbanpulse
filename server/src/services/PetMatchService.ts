import { db } from "@server/db";
import {
	type PetAlertType,
	type PetMatchType,
	petAlert,
	petMatch,
	pulse,
	type UserType,
	user,
} from "@server/db/schema";
import { petMatchRepository } from "@server/repositories/PetMatchRepository";
import { messagingService } from "@server/services/MessagingService";
import { notificationService } from "@server/services/NotificationService";
import { notificationFactory } from "@server/shared/NotificationFactory";
import { PetMatchStatusEnum } from "@shared/types";
import type {
	PetMatchActionResponse,
	PetMatchActor,
	PetMatchAlert,
	PetMatchRecord,
	PetMatchViewerRole,
	PetMatchWorkflowItem,
} from "@shared/validators/pet-matches/isPetMatchWorkflowValid";
import { desc, eq, inArray } from "drizzle-orm";

type UserPreview = Pick<UserType, "id" | "name" | "email" | "image">;

type PetMatchContext = {
	match: PetMatchType;
	lostAlert: PetAlertType;
	foundAlert: PetAlertType;
	lostOwnerId: string;
	foundOwnerId: string;
	lostOwner: UserPreview | null;
	foundOwner: UserPreview | null;
};

class PetMatchNotFoundError extends Error {}
class PetMatchForbiddenError extends Error {}
class PetMatchConflictError extends Error {}

const toIsoString = (value: Date | null | undefined) =>
	value ? value.toISOString() : null;

const toCounterpartUser = (
	entry: UserPreview | null,
	fallbackId: string,
): PetMatchActor => ({
	id: entry?.id ?? fallbackId,
	name: entry?.name ?? null,
	image: entry?.image ?? null,
});

const serializeMatchRecord = (match: PetMatchType): PetMatchRecord => ({
	id: match.id,
	lostAlertId: match.lostAlertId,
	foundAlertId: match.foundAlertId,
	status: match.status,
	confidenceScore: match.confidenceScore,
	imageSimilarity: match.imageSimilarity,
	matchedAttributes: Array.isArray(match.matchedAttributes)
		? match.matchedAttributes
		: [],
	createdAt: match.createdAt.toISOString(),
	updatedAt: match.updatedAt.toISOString(),
});

const serializeAlert = (
	alert: PetAlertType,
	ownerUserId: string,
): PetMatchAlert => ({
	id: alert.id,
	pulseId: alert.pulseId,
	alertType: alert.alertType,
	petType: alert.petType,
	color: alert.color,
	breed: alert.breed,
	imageUrl: alert.imageUrl,
	aiDescriptor: alert.aiDescriptor,
	embeddingStatus: alert.embeddingStatus,
	embeddingModel: alert.embeddingModel,
	embeddingUpdatedAt: toIsoString(alert.embeddingUpdatedAt),
	ownerUserId,
});

const createConflict = (message: string) => new PetMatchConflictError(message);

export class PetMatchService {
	private async getContextsByMatchIds(
		matchIds: string[],
	): Promise<Map<string, PetMatchContext>> {
		const uniqueIds = Array.from(new Set(matchIds));
		if (uniqueIds.length === 0) {
			return new Map();
		}

		const matches = await db
			.select()
			.from(petMatch)
			.where(inArray(petMatch.id, uniqueIds))
			.orderBy(desc(petMatch.updatedAt));

		if (matches.length === 0) {
			return new Map();
		}

		const alertIds = Array.from(
			new Set(
				matches.flatMap((match) => [match.lostAlertId, match.foundAlertId]),
			),
		);
		const alerts = await db
			.select()
			.from(petAlert)
			.where(inArray(petAlert.id, alertIds));
		const alertsById = new Map(alerts.map((entry) => [entry.id, entry]));

		const pulseIds = Array.from(new Set(alerts.map((entry) => entry.pulseId)));
		const pulseOwners =
			pulseIds.length === 0
				? []
				: await db
						.select({ id: pulse.id, userId: pulse.userId })
						.from(pulse)
						.where(inArray(pulse.id, pulseIds));
		const pulseOwnerByPulseId = new Map(
			pulseOwners.map((entry) => [entry.id, entry.userId]),
		);

		const ownerIds = Array.from(
			new Set(pulseOwners.map((entry) => entry.userId)),
		);
		const users =
			ownerIds.length === 0
				? []
				: await db
						.select({
							id: user.id,
							name: user.name,
							email: user.email,
							image: user.image,
						})
						.from(user)
						.where(inArray(user.id, ownerIds));
		const usersById = new Map(users.map((entry) => [entry.id, entry]));

		const contexts = new Map<string, PetMatchContext>();
		for (const match of matches) {
			const lostAlert = alertsById.get(match.lostAlertId);
			const foundAlert = alertsById.get(match.foundAlertId);

			if (!lostAlert || !foundAlert) {
				continue;
			}

			const lostOwnerId = pulseOwnerByPulseId.get(lostAlert.pulseId);
			const foundOwnerId = pulseOwnerByPulseId.get(foundAlert.pulseId);

			if (!lostOwnerId || !foundOwnerId) {
				continue;
			}

			if (lostOwnerId === foundOwnerId) {
				continue;
			}

			contexts.set(match.id, {
				match,
				lostAlert,
				foundAlert,
				lostOwnerId,
				foundOwnerId,
				lostOwner: usersById.get(lostOwnerId) ?? null,
				foundOwner: usersById.get(foundOwnerId) ?? null,
			});
		}

		return contexts;
	}

	private async getContextByMatchId(
		petMatchId: string,
	): Promise<PetMatchContext | null> {
		return (
			(await this.getContextsByMatchIds([petMatchId])).get(petMatchId) ?? null
		);
	}

	private getViewerRole(
		context: PetMatchContext,
		userId: string,
	): PetMatchViewerRole | null {
		if (context.lostOwnerId === userId) {
			return "lost_owner";
		}

		if (context.foundOwnerId === userId) {
			return "finder";
		}

		return null;
	}

	private toWorkflowItem(
		context: PetMatchContext,
		viewerUserId: string,
	): PetMatchWorkflowItem {
		const viewerRole = this.getViewerRole(context, viewerUserId);
		if (!viewerRole) {
			throw new PetMatchForbiddenError("You do not have access to that match.");
		}

		const isLostOwner = viewerRole === "lost_owner";
		const baseAlert = isLostOwner ? context.lostAlert : context.foundAlert;
		const matchedAlert = isLostOwner ? context.foundAlert : context.lostAlert;
		const baseOwnerId = isLostOwner
			? context.lostOwnerId
			: context.foundOwnerId;
		const matchedOwnerId = isLostOwner
			? context.foundOwnerId
			: context.lostOwnerId;
		const counterpart = isLostOwner ? context.foundOwner : context.lostOwner;

		return {
			petMatch: serializeMatchRecord(context.match),
			baseAlert: serializeAlert(baseAlert, baseOwnerId),
			matchedAlert: serializeAlert(matchedAlert, matchedOwnerId),
			counterpartUser: toCounterpartUser(counterpart, matchedOwnerId),
			viewerRole,
		};
	}

	private async notifyPetMatch(params: {
		recipientUserId: string;
		type:
			| "PET_ALERT_MATCH"
			| "PET_ALERT_MATCH_INTERESTED"
			| "PET_ALERT_MATCH_ACCEPTED"
			| "PET_ALERT_MATCH_DECLINED";
		item: PetMatchWorkflowItem;
		message: string;
		conversationId?: string | null;
	}) {
		const payload = {
			petMatchId: params.item.petMatch.id,
			status: params.item.petMatch.status,
			confidenceScore: params.item.petMatch.confidenceScore,
			imageSimilarity: params.item.petMatch.imageSimilarity,
			matchedAttributes: params.item.petMatch.matchedAttributes,
			baseAlert: params.item.baseAlert,
			matchedAlert: params.item.matchedAlert,
			counterpartUser: params.item.counterpartUser,
			conversationId: params.conversationId ?? null,
		};

		await notificationService.notifyUsers(
			[params.recipientUserId],
			notificationFactory.create({
				type: params.type,
				payload,
				message: params.message,
			}),
		);
	}

	private async updateStatus(params: {
		petMatchId: string;
		status: PetMatchStatusEnum;
	}) {
		return await petMatchRepository.update(params.petMatchId, {
			status: params.status,
			updatedAt: new Date(),
		});
	}

	async listForAlert(
		petAlertId: string,
		userId: string,
	): Promise<PetMatchWorkflowItem[]> {
		const [ownedAlert] = await db
			.select({ id: petAlert.id, ownerUserId: pulse.userId })
			.from(petAlert)
			.innerJoin(pulse, eq(petAlert.pulseId, pulse.id))
			.where(eq(petAlert.id, petAlertId))
			.limit(1);

		if (!ownedAlert) {
			throw new PetMatchNotFoundError("Pet alert not found.");
		}

		if (ownedAlert.ownerUserId !== userId) {
			throw new PetMatchForbiddenError(
				"You do not have access to review matches for that alert.",
			);
		}

		const matches = await petMatchRepository.listByAlertId(petAlertId);
		const contexts = await this.getContextsByMatchIds(
			matches.map((match) => match.id),
		);

		return matches.flatMap((match) => {
			const context = contexts.get(match.id);
			if (!context) {
				return [];
			}

			const viewerRole = this.getViewerRole(context, userId);
			if (!viewerRole) {
				return [];
			}

			const alertIsOwnedByViewer =
				(viewerRole === "lost_owner" && context.lostAlert.id === petAlertId) ||
				(viewerRole === "finder" && context.foundAlert.id === petAlertId);

			if (!alertIsOwnedByViewer) {
				return [];
			}

			return [this.toWorkflowItem(context, userId)];
		});
	}

	async getDetail(
		petMatchId: string,
		userId: string,
	): Promise<PetMatchWorkflowItem> {
		const context = await this.getContextByMatchId(petMatchId);
		if (!context) {
			throw new PetMatchNotFoundError("Pet match not found.");
		}

		return this.toWorkflowItem(context, userId);
	}

	async markOwnerInterested(
		petMatchId: string,
		userId: string,
	): Promise<PetMatchActionResponse> {
		const context = await this.getContextByMatchId(petMatchId);
		if (!context) {
			throw new PetMatchNotFoundError("Pet match not found.");
		}

		if (context.lostOwnerId !== userId) {
			throw new PetMatchForbiddenError(
				"Only the lost-pet owner can confirm this match.",
			);
		}

		if (context.match.status !== PetMatchStatusEnum.PendingReview) {
			throw createConflict("This match has already been reviewed.");
		}

		await this.updateStatus({
			petMatchId,
			status: PetMatchStatusEnum.OwnerInterested,
		});

		const refreshed = await this.getContextByMatchId(petMatchId);
		if (!refreshed) {
			throw new PetMatchNotFoundError("Pet match not found.");
		}

		const ownerItem = this.toWorkflowItem(refreshed, userId);
		const finderItem = this.toWorkflowItem(refreshed, refreshed.foundOwnerId);
		await this.notifyPetMatch({
			recipientUserId: refreshed.foundOwnerId,
			type: "PET_ALERT_MATCH_INTERESTED",
			item: finderItem,
			message: `${
				refreshed.lostOwner?.name ?? "Someone"
			} thinks the pet you found may be theirs`,
		});

		return { item: ownerItem, conversationId: null };
	}

	async dismissAsOwner(
		petMatchId: string,
		userId: string,
	): Promise<PetMatchActionResponse> {
		const context = await this.getContextByMatchId(petMatchId);
		if (!context) {
			throw new PetMatchNotFoundError("Pet match not found.");
		}

		if (context.lostOwnerId !== userId) {
			throw new PetMatchForbiddenError(
				"Only the lost-pet owner can dismiss this match.",
			);
		}

		if (context.match.status !== PetMatchStatusEnum.PendingReview) {
			throw createConflict("This match has already been reviewed.");
		}

		await this.updateStatus({
			petMatchId,
			status: PetMatchStatusEnum.OwnerDismissed,
		});

		return {
			item: await this.getDetail(petMatchId, userId),
			conversationId: null,
		};
	}

	async acceptAsFinder(
		petMatchId: string,
		userId: string,
	): Promise<PetMatchActionResponse> {
		const context = await this.getContextByMatchId(petMatchId);
		if (!context) {
			throw new PetMatchNotFoundError("Pet match not found.");
		}

		if (context.foundOwnerId !== userId) {
			throw new PetMatchForbiddenError(
				"Only the finder can approve this match.",
			);
		}

		if (context.match.status !== PetMatchStatusEnum.OwnerInterested) {
			throw createConflict("This match is not ready to open a chat.");
		}

		const conversation = await messagingService.ensureCoordinationConversation(
			context.lostOwnerId,
			context.foundOwnerId,
		);
		if (!conversation) {
			throw createConflict(
				"Could not open a coordination chat for this match.",
			);
		}

		await this.updateStatus({
			petMatchId,
			status: PetMatchStatusEnum.FinderAccepted,
		});

		const refreshed = await this.getContextByMatchId(petMatchId);
		if (!refreshed) {
			throw new PetMatchNotFoundError("Pet match not found.");
		}

		const finderItem = this.toWorkflowItem(refreshed, userId);
		const ownerItem = this.toWorkflowItem(refreshed, refreshed.lostOwnerId);
		await this.notifyPetMatch({
			recipientUserId: refreshed.lostOwnerId,
			type: "PET_ALERT_MATCH_ACCEPTED",
			item: ownerItem,
			message: `${
				refreshed.foundOwner?.name ?? "The finder"
			} approved the match and opened a chat`,
			conversationId: conversation.id,
		});

		return {
			item: finderItem,
			conversationId: conversation.id,
		};
	}

	async declineAsFinder(
		petMatchId: string,
		userId: string,
	): Promise<PetMatchActionResponse> {
		const context = await this.getContextByMatchId(petMatchId);
		if (!context) {
			throw new PetMatchNotFoundError("Pet match not found.");
		}

		if (context.foundOwnerId !== userId) {
			throw new PetMatchForbiddenError(
				"Only the finder can decline this match.",
			);
		}

		if (context.match.status !== PetMatchStatusEnum.OwnerInterested) {
			throw createConflict("This match is not waiting for finder approval.");
		}

		await this.updateStatus({
			petMatchId,
			status: PetMatchStatusEnum.FinderDeclined,
		});

		const refreshed = await this.getContextByMatchId(petMatchId);
		if (!refreshed) {
			throw new PetMatchNotFoundError("Pet match not found.");
		}

		const finderItem = this.toWorkflowItem(refreshed, userId);
		const ownerItem = this.toWorkflowItem(refreshed, refreshed.lostOwnerId);
		await this.notifyPetMatch({
			recipientUserId: refreshed.lostOwnerId,
			type: "PET_ALERT_MATCH_DECLINED",
			item: ownerItem,
			message: `${
				refreshed.foundOwner?.name ?? "The finder"
			} declined the match request`,
		});

		return { item: finderItem, conversationId: null };
	}

	async notifyCandidateMatches(petMatchIds: string[]) {
		const contexts = await this.getContextsByMatchIds(petMatchIds);

		for (const petMatchId of petMatchIds) {
			const context = contexts.get(petMatchId);
			if (!context) {
				continue;
			}

			if (context.match.status !== PetMatchStatusEnum.PendingReview) {
				continue;
			}

			await this.notifyPetMatch({
				recipientUserId: context.lostOwnerId,
				type: "PET_ALERT_MATCH",
				item: this.toWorkflowItem(context, context.lostOwnerId),
				message: "Possible match found for your lost pet",
			});
		}
	}
}

export const petMatchService = new PetMatchService();
export { PetMatchConflictError, PetMatchForbiddenError, PetMatchNotFoundError };
