import { db } from "@server/db";
import {
	type ConversationType,
	conversation,
	conversationMember,
	type MessageType,
	type UserType,
	user,
} from "@server/db/schema";
import { cacheManager } from "@server/services/cache/CacheManager";
import { conversationMemberRepository } from "@server/repositories/ConversationMemberRepository";
import { conversationRepository } from "@server/repositories/ConversationRepository";
import { messageRepository } from "@server/repositories/MessageRepository";
import { notificationService } from "@server/services/NotificationService";
import { notificationFactory } from "@server/shared/NotificationFactory";
import { handleError } from "@server/utils/handleError";
import { ConversationTypeEnum } from "@shared/types";
import { desc, eq, inArray, sql } from "drizzle-orm";

type ConversationMemberView = Pick<UserType, "id" | "name" | "image" | "email">;

type ConversationSummary = {
	conversation: ConversationType;
	members: ConversationMemberView[];
	lastMessage: MessageType | null;
};

type ConversationThread = ConversationSummary & {
	messages: Array<
		MessageType & {
			sender: ConversationMemberView | null;
		}
	>;
};

export class MessagingService {
	private cache = cacheManager;

	private async findExactPairConversations(
		userId: string,
		otherUserId: string,
		types: ConversationTypeEnum[],
	) {
		return await db
			.select({
				id: conversation.id,
				type: conversation.type,
				pulseId: conversation.pulseId,
				createdAt: conversation.createdAt,
			})
			.from(conversation)
			.innerJoin(
				conversationMember,
				eq(conversation.id, conversationMember.conversationId),
			)
			.where(inArray(conversation.type, types))
			.groupBy(
				conversation.id,
				conversation.type,
				conversation.pulseId,
				conversation.createdAt,
			)
			.having(sql`
				count(distinct ${conversationMember.userId}) = 2
				and count(
					distinct case
						when ${conversationMember.userId} in (${userId}, ${otherUserId})
						then ${conversationMember.userId}
					end
				) = 2
			`);
	}

	private async getConversationBase(conversationId: string) {
		const foundConversation =
			await conversationRepository.getOne(conversationId);
		if (!foundConversation) {
			return null;
		}

		const [memberships, messages] = await Promise.all([
			conversationMemberRepository.getByConversationId(conversationId),
			messageRepository.getByConversationId(conversationId),
		]);

		const memberIds = memberships.map((entry) => entry.userId);
		const memberRows =
			memberIds.length === 0
				? []
				: await db
						.select({
							id: user.id,
							name: user.name,
							image: user.image,
							email: user.email,
						})
						.from(user)
						.where(inArray(user.id, memberIds));

		const members = memberRows.map((entry) => ({
			id: entry.id,
			name: entry.name,
			image: entry.image,
			email: entry.email,
		}));

		return {
			conversation: foundConversation,
			members,
			messages,
		};
	}

	private async assertMember(conversationId: string, userId: string) {
		return await conversationMemberRepository.findByConversationAndUser(
			conversationId,
			userId,
		);
	}

	async ensureDirectConversation(userId: string, otherUserId: string) {
		if (userId === otherUserId) {
			return null;
		}

		const [existing] = await this.findExactPairConversations(
			userId,
			otherUserId,
			[ConversationTypeEnum.Direct],
		);

		if (existing) {
			return await conversationRepository.getOne(existing.id);
		}

		const created = await conversationRepository.create({
			type: ConversationTypeEnum.Direct,
		});
		if (!created) {
			return null;
		}

		await Promise.all([
			conversationMemberRepository.create({
				conversationId: created.id,
				userId,
			}),
			conversationMemberRepository.create({
				conversationId: created.id,
				userId: otherUserId,
			}),
		]);

		return created;
	}

	async ensureCoordinationConversation(userId: string, otherUserId: string) {
		if (userId === otherUserId) {
			return null;
		}

		const [directConversation] = await this.findExactPairConversations(
			userId,
			otherUserId,
			[ConversationTypeEnum.Direct],
		);

		if (directConversation) {
			return await conversationRepository.getOne(directConversation.id);
		}

		const legacyPulseConversations = await this.findExactPairConversations(
			userId,
			otherUserId,
			[ConversationTypeEnum.Pulse],
		);

		const earliestPulseConversation = legacyPulseConversations.sort((a, b) => {
			return a.createdAt.getTime() - b.createdAt.getTime();
		})[0];

		if (earliestPulseConversation) {
			return await conversationRepository.update(earliestPulseConversation.id, {
				type: ConversationTypeEnum.Direct,
				pulseId: null,
			});
		}

		return await this.ensureDirectConversation(userId, otherUserId);
	}

	async ensurePulseConversation(pulseId: string, memberIds: string[]) {
		const uniqueMemberIds = Array.from(new Set(memberIds.filter(Boolean)));
		let pulseConversation = await conversationRepository.findByPulseId(pulseId);

		if (!pulseConversation) {
			pulseConversation = await conversationRepository.create({
				type: ConversationTypeEnum.Pulse,
				pulseId,
			});
		}

		if (!pulseConversation) {
			return null;
		}

		for (const userId of uniqueMemberIds) {
			const existing =
				await conversationMemberRepository.findByConversationAndUser(
					pulseConversation.id,
					userId,
				);
			if (!existing) {
				await conversationMemberRepository.create({
					conversationId: pulseConversation.id,
					userId,
				});
			}
		}

		return pulseConversation;
	}

	async listConversationsForUser(
		userId: string,
	): Promise<ConversationSummary[]> {
		const memberships = await conversationMemberRepository.getByUserId(userId);
		const conversationIds = memberships.map((entry) => entry.conversationId);

		if (conversationIds.length === 0) {
			return [];
		}

		const conversations = await db
			.select()
			.from(conversation)
			.where(inArray(conversation.id, conversationIds))
			.orderBy(desc(conversation.createdAt));

		const summaries = await Promise.all(
			conversations.map(async (entry) => {
				const base = await this.getConversationBase(entry.id);
				if (!base) {
					return null;
				}

				return {
					conversation: entry,
					members: base.members,
					lastMessage: base.messages.at(-1) ?? null,
				};
			}),
		);

		return summaries.filter(
			(entry): entry is ConversationSummary => entry !== null,
		);
	}

	async getConversationThread(
		userId: string,
		conversationId: string,
	): Promise<ConversationThread | null> {
		const membership = await this.assertMember(conversationId, userId);
		if (!membership) {
			return null;
		}

		const base = await this.getConversationBase(conversationId);
		if (!base) {
			return null;
		}

		const senderIds = base.messages.map((entry) => entry.senderId);
		const senderRows =
			senderIds.length === 0
				? []
				: await db
						.select({
							id: user.id,
							name: user.name,
							image: user.image,
							email: user.email,
						})
						.from(user)
						.where(inArray(user.id, Array.from(new Set(senderIds))));
		const sendersById = new Map(senderRows.map((entry) => [entry.id, entry]));

		return {
			conversation: base.conversation,
			members: base.members,
			lastMessage: base.messages.at(-1) ?? null,
			messages: base.messages.map((entry) => ({
				...entry,
				sender: sendersById.get(entry.senderId) ?? null,
			})),
		};
	}

	async sendMessage(params: {
		conversationId: string;
		senderId: string;
		content: string;
	}) {
		const membership = await this.assertMember(
			params.conversationId,
			params.senderId,
		);
		if (!membership) {
			return null;
		}

		try {
			const created = await messageRepository.create({
				conversationId: params.conversationId,
				senderId: params.senderId,
				content: params.content,
			});
			if (!created) {
				return null;
			}

			const thread = await this.getConversationThread(
				params.senderId,
				params.conversationId,
			);
			if (!thread) {
				return null;
			}

			const recipients = thread.members
				.map((entry) => entry.id)
				.filter((entry) => entry !== params.senderId);
			if (recipients.length > 0) {
				const broadcastData = notificationFactory.create({
					type: "MESSAGE",
					message: "New coordination message",
					payload: {
						conversationId: params.conversationId,
						messageId: created.id,
						senderId: params.senderId,
						preview: created.content.slice(0, 140),
					},
				});
				await notificationService.notifyUsers(recipients, broadcastData);
			}

			return {
				message: created,
				thread,
			};
		} catch (error) {
			handleError(error);
			return null;
		}
	}
}

export const messagingService = new MessagingService();
