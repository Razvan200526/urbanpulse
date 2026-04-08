import { db } from "@server/db";
import * as schema from "@server/db/schema";
import {
	ConversationTypeEnum,
	PulseEnum,
	PulseStatusEnum,
	PulseUploadStateEnum,
	ResponseStatusEnum,
	TransactionStatusEnum,
	UrgencyEnum,
} from "@shared/types";

let sequence = 0;

function nextToken(prefix: string) {
	sequence += 1;
	return `${prefix}-${sequence}-${crypto.randomUUID().slice(0, 8)}`;
}

function nextDate() {
	return new Date(Date.UTC(2025, 0, 1, 0, 0, sequence));
}

function requireInsertedRow<T>(rows: T[]) {
	const row = rows[0];
	if (!row) {
		throw new Error("Expected insert().returning() to return a row");
	}
	return row;
}

export async function createUser(
	overrides: Partial<typeof schema.user.$inferInsert> = {},
) {
	const rows = await db
		.insert(schema.user)
		.values({
			id: nextToken("user"),
			name: `User ${sequence + 1}`,
			email: `${nextToken("user")}@example.com`,
			emailVerified: true,
			createdAt: nextDate(),
			updatedAt: nextDate(),
			role: "user",
			...overrides,
		})
		.returning();

	return requireInsertedRow(rows);
}

export async function createPulse(
	overrides: Partial<typeof schema.pulse.$inferInsert> = {},
) {
	const userId = overrides.userId ?? (await createUser()).id;
	const rows = await db
		.insert(schema.pulse)
		.values({
			type: PulseEnum.Emergency,
			userId,
			urgency: UrgencyEnum.Urgent,
			title: nextToken("pulse").slice(0, 30),
			description: "Repository test pulse",
			position: { x: 26.1025, y: 44.4268 } as any,
			status: PulseStatusEnum.Active,
			pulseUploadState: PulseUploadStateEnum.Pending,
			imageUrls: [],
			isResolved: false,
			createdAt: nextDate(),
			...overrides,
		})
		.returning();

	return requireInsertedRow(rows);
}

export async function createConversation(
	overrides: Partial<typeof schema.conversation.$inferInsert> = {},
) {
	const rows = await db
		.insert(schema.conversation)
		.values({
			type: ConversationTypeEnum.Direct,
			createdAt: nextDate(),
			...overrides,
		})
		.returning();

	return requireInsertedRow(rows);
}

export async function createConversationMember(
	overrides: Partial<typeof schema.conversationMember.$inferInsert> = {},
) {
	const conversationId =
		overrides.conversationId ?? (await createConversation()).id;
	const userId = overrides.userId ?? (await createUser()).id;
	const rows = await db
		.insert(schema.conversationMember)
		.values({
			conversationId,
			userId,
			...overrides,
		})
		.returning();

	return requireInsertedRow(rows);
}

export async function createMessage(
	overrides: Partial<typeof schema.message.$inferInsert> = {},
) {
	const conversationId =
		overrides.conversationId ?? (await createConversation()).id;
	const senderId = overrides.senderId ?? (await createUser()).id;
	const rows = await db
		.insert(schema.message)
		.values({
			conversationId,
			senderId,
			content: "Repository test message",
			sentAt: nextDate(),
			...overrides,
		})
		.returning();

	return requireInsertedRow(rows);
}

export async function createNotification(
	overrides: Partial<typeof schema.notification.$inferInsert> = {},
) {
	const userId = overrides.userId ?? (await createUser()).id;
	const rows = await db
		.insert(schema.notification)
		.values({
			userId,
			type: "MESSAGE",
			payload: { body: nextToken("payload") },
			read: false,
			createdAt: nextDate(),
			...overrides,
		})
		.returning();

	return requireInsertedRow(rows);
}

export async function createPetAlert(
	overrides: Partial<typeof schema.petAlert.$inferInsert> = {},
) {
	const pulseId = overrides.pulseId ?? (await createPulse()).id;
	const rows = await db
		.insert(schema.petAlert)
		.values({
			pulseId,
			petType: "Dog",
			color: "Brown",
			breed: "Mixed",
			imageUrl: "https://example.com/pet.jpg",
			aiDescriptor: "small brown dog",
			...overrides,
		})
		.returning();

	return requireInsertedRow(rows);
}

export async function createPetMatch(
	overrides: Partial<typeof schema.petMatch.$inferInsert> = {},
) {
	const lostAlertId = overrides.lostAlertId ?? (await createPetAlert()).id;
	const foundAlertId = overrides.foundAlertId ?? (await createPetAlert()).id;
	const rows = await db
		.insert(schema.petMatch)
		.values({
			lostAlertId,
			foundAlertId,
			confidenceScore: 0.92,
			createdAt: nextDate(),
			...overrides,
		})
		.returning();

	return requireInsertedRow(rows);
}

export async function createPulseConfirmation(
	overrides: Partial<typeof schema.pulseConfirmation.$inferInsert> = {},
) {
	const pulseId = overrides.pulseId ?? (await createPulse()).id;
	const userId = overrides.userId ?? (await createUser()).id;
	const rows = await db
		.insert(schema.pulseConfirmation)
		.values({
			pulseId,
			userId,
			confirmedAt: nextDate(),
			...overrides,
		})
		.returning();

	return requireInsertedRow(rows);
}

export async function createResponse(
	overrides: Partial<typeof schema.pulseResponse.$inferInsert> = {},
) {
	const pulseId = overrides.pulseId ?? (await createPulse()).id;
	const responderId = overrides.responderId ?? (await createUser()).id;
	const rows = await db
		.insert(schema.pulseResponse)
		.values({
			pulseId,
			responderId,
			status: ResponseStatusEnum.Pending,
			createdAt: nextDate(),
			...overrides,
		})
		.returning();

	return requireInsertedRow(rows);
}

export async function createQuietHours(
	overrides: Partial<typeof schema.quietHours.$inferInsert> = {},
) {
	const userId = overrides.userId ?? (await createUser()).id;
	const rows = await db
		.insert(schema.quietHours)
		.values({
			userId,
			startTime: "22:00:00",
			endTime: "06:00:00",
			days: "Mon,Tue,Wed",
			...overrides,
		})
		.returning();

	return requireInsertedRow(rows);
}

export async function createReport(
	overrides: Partial<typeof schema.report.$inferInsert> = {},
) {
	const reporterId = overrides.reporterId ?? (await createUser()).id;
	const rows = await db
		.insert(schema.report)
		.values({
			reporterId,
			reason: "Spam",
			createdAt: nextDate(),
			...overrides,
		})
		.returning();

	return requireInsertedRow(rows);
}

export async function createResource(
	overrides: Partial<typeof schema.resource.$inferInsert> = {},
) {
	const userId = overrides.userId ?? (await createUser()).id;
	const rows = await db
		.insert(schema.resource)
		.values({
			userId,
			name: nextToken("resource"),
			description: "Repository test resource",
			availability: "Available",
			position: { x: 26.1025, y: 44.4268 } as any,
			resourceType: "Item",
			locationLabel: "Bucharest",
			imageUrls: [],
			createdAt: nextDate(),
			...overrides,
		})
		.returning();

	return requireInsertedRow(rows);
}

export async function createSkill(
	overrides: Partial<typeof schema.skill.$inferInsert> = {},
) {
	const userId = overrides.userId ?? (await createUser()).id;
	const rows = await db
		.insert(schema.skill)
		.values({
			tag: nextToken("skill"),
			userId,
			...overrides,
		})
		.returning();

	return requireInsertedRow(rows);
}

export async function createTransaction(
	overrides: Partial<typeof schema.transaction.$inferInsert> = {},
) {
	const resourceId = overrides.resourceId ?? (await createResource()).id;
	const rows = await db
		.insert(schema.transaction)
		.values({
			resourceId,
			status: TransactionStatusEnum.Pending,
			startAt: nextDate(),
			endAt: null,
			...overrides,
		})
		.returning();

	return requireInsertedRow(rows);
}

export async function createResourceReview(
	overrides: Partial<typeof schema.resourceReview.$inferInsert> = {},
) {
	const resourceId = overrides.resourceId ?? (await createResource()).id;
	const reviewerId = overrides.reviewerId ?? (await createUser()).id;
	const revieweeId = overrides.revieweeId ?? (await createUser()).id;
	const transactionId =
		overrides.transactionId ??
		(
			await createTransaction({
				resourceId,
				borrowerId: reviewerId,
				lenderId: revieweeId,
				status: TransactionStatusEnum.Completed,
				endAt: nextDate(),
			})
		).id;
	const rows = await db
		.insert(schema.resourceReview)
		.values({
			transactionId,
			resourceId,
			reviewerId,
			revieweeId,
			rating: 5,
			comment: "Helpful handoff",
			createdAt: nextDate(),
			...overrides,
		})
		.returning();

	return requireInsertedRow(rows);
}
