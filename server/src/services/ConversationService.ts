import { db } from "@server/db";
import {
  conversation,
  conversationMember,
  message,
  type UserType,
  user,
} from "@server/db/schema";
import { conversationRepository } from "@server/repositories/ConversationRepository";
import { messageRepository } from "@server/repositories/MessageRepository";
import { handleError } from "@server/utils/handleError";
import type { SendConversationMessageType } from "@shared/validators/messages/isConversationMessageValid";
import type { CreateConversationType } from "@shared/validators/messages/isConversationValid";
import { and, asc, desc, eq } from "drizzle-orm";

type ConversationMemberPreview = Pick<
  UserType,
  "id" | "name" | "email" | "image"
>;

export class ConversationService {

  async isMember(conversationId: string, userId: string) {
    const [membership] = await db
      .select()
      .from(conversationMember)
      .where(
        and(
          eq(conversationMember.conversationId, conversationId),
          eq(conversationMember.userId, userId),
        ),
      )
      .limit(1);

    return Boolean(membership);
  }

  async createConversation(
    ownerUserId: string,
    payload: CreateConversationType,
  ) {
    try {
      const memberIds = Array.from(
        new Set([ownerUserId, ...payload.memberIds]),
      );
      const created = await db.transaction(async (tx) => {
        const [conversationRow] = await tx
          .insert(conversation)
          .values({
            type: payload.type,
            pulseId: payload.pulseId ?? null,
          })
          .returning();

        if (!conversationRow) {
          throw new Error("Failed to create conversation");
        }

        await tx.insert(conversationMember).values(
          memberIds.map((memberId) => ({
            conversationId: conversationRow.id,
            userId: memberId,
          })),
        );

        return conversationRow;
      });

      return this.getConversationSummary(created.id, ownerUserId);
    } catch (error) {
      handleError(error);
      return null;
    }
  }

  async getConversationSummary(conversationId: string, viewerUserId: string) {
    const isAllowed = await this.isMember(conversationId, viewerUserId);
    if (!isAllowed) {
      return null;
    }

    const conversationRow = await conversationRepository.getOne(conversationId);
    if (!conversationRow) {
      return null;
    }

    const members = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
      })
      .from(conversationMember)
      .innerJoin(user, eq(conversationMember.userId, user.id))
      .where(eq(conversationMember.conversationId, conversationId));

    const [lastMessage] = await db
      .select()
      .from(message)
      .where(eq(message.conversationId, conversationId))
      .orderBy(desc(message.sentAt))
      .limit(1);

    return {
      ...conversationRow,
      members,
      lastMessage: lastMessage ?? null,
    };
  }

  async listConversationsForUser(userId: string) {
    try {
      const memberships = await db
        .select({
          conversationId: conversationMember.conversationId,
        })
        .from(conversationMember)
        .where(eq(conversationMember.userId, userId));

      if (memberships.length === 0) {
        return [];
      }

      const conversationIds = memberships.map((entry) => entry.conversationId);
      return await Promise.all(
        conversationIds.map((conversationId) =>
          this.getConversationSummary(conversationId, userId),
        ),
      ).then((rows) => rows.filter(Boolean));
    } catch (error) {
      handleError(error);
      return [];
    }
  }

  async listMessages(conversationId: string, userId: string) {
    try {
      const isAllowed = await this.isMember(conversationId, userId);
      if (!isAllowed) {
        return null;
      }

      return await db
        .select({
          id: message.id,
          content: message.content,
          sentAt: message.sentAt,
          sender: {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
          },
        })
        .from(message)
        .innerJoin(user, eq(message.senderId, user.id))
        .where(eq(message.conversationId, conversationId))
        .orderBy(asc(message.sentAt));
    } catch (error) {
      handleError(error);
      return null;
    }
  }

  async sendMessage(
    conversationId: string,
    senderId: string,
    payload: SendConversationMessageType,
  ) {
    try {
      const isAllowed = await this.isMember(conversationId, senderId);
      if (!isAllowed) {
        return null;
      }

      const created = await messageRepository.create({
        conversationId,
        senderId,
        content: payload.content,
      });

      if (!created) {
        return null;
      }

      const [sender] = await db
        .select({
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        })
        .from(user)
        .where(eq(user.id, senderId))
        .limit(1);

      return {
        ...created,
        sender: sender as ConversationMemberPreview | undefined,
      };
    } catch (error) {
      handleError(error);
      return null;
    }
  }
}

export const conversationService = new ConversationService();
