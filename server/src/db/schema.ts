import {
	type ConversationTypeEnum,
	PulseEnum,
	PulseStatusEnum,
	PulseUploadStateEnum,
	type ReportStatusEnum,
	type ResourceAvailabilityType,
	type ResourceItemType,
	type ResponseStatusEnum,
	type NotificationType as SharedNotificationType,
	type TransactionStatusEnum,
	type UrgencyEnum,
} from "@shared/types";
import { type InferSelectModel, relations, sql } from "drizzle-orm";
import {
	boolean,
	doublePrecision,
	geometry,
	index,
	integer,
	jsonb,
	pgTable,
	text,
	time,
	timestamp,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";

export const user = pgTable(
	"user",
	{
		id: text("id").primaryKey(),
		name: text("name").notNull(),
		email: text("email").notNull().unique(),
		emailVerified: boolean("emailVerified").notNull(),
		image: text("image"),
		createdAt: timestamp("createdAt").notNull(),
		updatedAt: timestamp("updatedAt").notNull(),
		role: text("role").default("user"),
		bio: text("bio"),
		trustScore: doublePrecision("trustScore").default(0),
		successfulInteractions: integer("successfulInteractions").default(0),
		isVerified: boolean("isVerified").default(false),
		rememberMe: boolean("rememberMe").default(false),
		banned: boolean("banned").default(false),
		banReason: text("banReason"),
		banExpires: timestamp("banExpires"),
		homeLocation: geometry("homeLocation", {
			type: "point",
			mode: "xy",
			srid: 4326,
		}),
		lastKnownLocation: geometry("lastKnownLocation", {
			type: "point",
			mode: "xy",
			srid: 4326,
		}),
		lastKnownLocationUpdatedAt: timestamp("lastKnownLocationUpdatedAt"),
		heroAlertRadiusMeters: integer("heroAlertRadiusMeters")
			.notNull()
			.default(500),
	},
	(t) => [
		index("user_home_location_spatial_index").using("gist", t.homeLocation),
		index("user_last_known_location_spatial_index").using(
			"gist",
			t.lastKnownLocation,
		),
	],
);

export const session = pgTable("session", {
	id: text("id").primaryKey(),
	expiresAt: timestamp("expiresAt").notNull(),
	token: text("token").notNull().unique(),
	createdAt: timestamp("createdAt").notNull(),
	updatedAt: timestamp("updatedAt").notNull(),
	ipAddress: text("ipAddress"),
	userAgent: text("userAgent"),
	impersonatedBy: text("impersonatedBy"),
	userId: text("userId")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
	id: text("id").primaryKey(),
	accountId: text("accountId").notNull(),
	providerId: text("providerId").notNull(),
	userId: text("userId")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	accessToken: text("accessToken"),
	refreshToken: text("refreshToken"),
	idToken: text("idToken"),
	accessTokenExpiresAt: timestamp("accessTokenExpiresAt"),
	refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt"),
	scope: text("scope"),
	password: text("password"),
	createdAt: timestamp("createdAt").notNull(),
	updatedAt: timestamp("updatedAt").notNull(),
});

export const verification = pgTable("verification", {
	id: text("id").primaryKey(),
	identifier: text("identifier").notNull(),
	value: text("value").notNull(),
	expiresAt: timestamp("expiresAt").notNull(),
	createdAt: timestamp("createdAt"),
	updatedAt: timestamp("updatedAt"),
});

export const pulse = pgTable(
	"pulse",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		type: text("type")
			.$type<PulseEnum>()
			.notNull()
			.default(PulseEnum.Emergency),
		userId: text("userId")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		urgency: text("urgency").$type<UrgencyEnum>().notNull(),
		title: varchar("title", { length: 100 }).notNull(),
		description: text("description"),
		position: geometry("location", {
			type: "point",
			mode: "xy",
			srid: 4326,
		}).notNull(),
		status: text("status")
			.$type<PulseStatusEnum>()
			.notNull()
			.default(PulseStatusEnum.Active),
		pulseUploadState: text("pulseUploadState")
			.$type<PulseUploadStateEnum>()
			.notNull()
			.default(PulseUploadStateEnum.Pending),
		audioUrl: text("audioUrl"),
		imageUrls: text("imageUrls").array().notNull().default(sql`'{}'::text[]`),
		requestedSkillTags: text("requestedSkillTags")
			.array()
			.notNull()
			.default(sql`'{}'::text[]`),
		matchMetadata: jsonb("matchMetadata")
			.$type<Record<string, unknown>>()
			.notNull()
			.default(sql`'{}'::jsonb`),
		isResolved: boolean("isResolved").notNull().default(false),
		isVerified: boolean("isVerified"),
		mergedIntoPulseId: uuid("mergedIntoPulseId"),
		moderationNote: text("moderationNote"),
		createdAt: timestamp("createdAt").notNull().defaultNow(),
	},
	(t) => [index("spatial_index").using("gist", t.position)],
);

export const conversation = pgTable("conversation", {
	id: uuid("id").defaultRandom().primaryKey(),
	type: text("type").$type<ConversationTypeEnum>().notNull(),
	pulseId: uuid("pulseId").references(() => pulse.id, { onDelete: "set null" }),
	createdAt: timestamp("createdAt").notNull().defaultNow(),
});

export const conversationMember = pgTable("conversation_member", {
	id: uuid("id").defaultRandom().primaryKey(),
	conversationId: uuid("conversationId")
		.notNull()
		.references(() => conversation.id, { onDelete: "cascade" }),
	userId: text("userId")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
});

export const message = pgTable("message", {
	id: uuid("id").defaultRandom().primaryKey(),
	conversationId: uuid("conversationId")
		.notNull()
		.references(() => conversation.id, { onDelete: "cascade" }),
	senderId: text("senderId")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	content: text("content").notNull(),
	sentAt: timestamp("sentAt").notNull().defaultNow(),
});

export const notification = pgTable("notification", {
	id: uuid("id").defaultRandom().primaryKey(),
	userId: text("userId")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	type: text("type").$type<SharedNotificationType>().notNull(),
	payload: jsonb("payload").notNull(),
	read: boolean("read").notNull().default(false),
	createdAt: timestamp("createdAt").notNull().defaultNow(),
});

export const petAlert = pgTable("pet_alert", {
	id: uuid("id").defaultRandom().primaryKey(),
	pulseId: uuid("pulseId")
		.notNull()
		.references(() => pulse.id, { onDelete: "cascade" }),
	petType: text("petType").notNull(),
	color: text("color").notNull(),
	breed: text("breed"),
	imageUrl: text("imageUrl"),
	aiDescriptor: text("aiDescriptor"),
});

export const petMatch = pgTable("pet_match", {
	id: uuid("id").defaultRandom().primaryKey(),
	lostAlertId: uuid("lostAlertId")
		.notNull()
		.references(() => petAlert.id, { onDelete: "cascade" }),
	foundAlertId: uuid("foundAlertId")
		.notNull()
		.references(() => petAlert.id, { onDelete: "cascade" }),
	confidenceScore: doublePrecision("confidenceScore").notNull(),
	createdAt: timestamp("createdAt").notNull().defaultNow(),
});

export const pulseConfirmation = pgTable("pulse_confirmation", {
	id: uuid("id").defaultRandom().primaryKey(),
	pulseId: uuid("pulseId")
		.notNull()
		.references(() => pulse.id, { onDelete: "cascade" }),
	userId: text("userId")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	confirmedAt: timestamp("confirmedAt").notNull().defaultNow(),
});

export const pulseResponse = pgTable("response", {
	id: uuid("id").defaultRandom().primaryKey(),
	pulseId: uuid("pulseId")
		.notNull()
		.references(() => pulse.id, { onDelete: "cascade" }),
	responderId: text("responderId")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	status: text("status").$type<ResponseStatusEnum>().notNull(),
	createdAt: timestamp("createdAt").notNull().defaultNow(),
});

export const quietHours = pgTable("quiet_hours", {
	id: uuid("id").defaultRandom().primaryKey(),
	userId: text("userId")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	startTime: time("startTime").notNull(),
	endTime: time("endTime").notNull(),
	days: text("days").notNull(),
});

export const report = pgTable("report", {
	id: uuid("id").defaultRandom().primaryKey(),
	reporterId: text("reporterId")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	targetUserId: text("targetUserId").references(() => user.id, {
		onDelete: "cascade",
	}),
	targetPulseId: uuid("targetPulseId").references(() => pulse.id, {
		onDelete: "cascade",
	}),
	reason: text("reason").notNull(),
	status: text("status")
		.$type<ReportStatusEnum>()
		.notNull()
		.default("Pending" as ReportStatusEnum),
	createdAt: timestamp("createdAt").notNull().defaultNow(),
});

export const resource = pgTable(
	"resources",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		userId: text("userId")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		name: text("name").notNull(),
		description: text("description"),
		availability: text("availability")
			.$type<ResourceAvailabilityType>()
			.notNull(),
		position: geometry("location", {
			type: "point",
			mode: "xy",
			srid: 4326,
		}).notNull(),
		locationLabel: text("locationLabel"),
		resourceType: text("resourceType").$type<ResourceItemType>().notNull(),
		imageUrls: text("imageUrls").array().notNull().default(sql`'{}'::text[]`),
		createdAt: timestamp("createdAt").notNull().defaultNow(),
	},
	(t) => [index("resource_spatial_index").using("gist", t.position)],
);

export const skill = pgTable("skill", {
	id: uuid("id").defaultRandom().primaryKey(),
	tag: text("tag").notNull(),
	userId: text("userId")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
});

export const transaction = pgTable("transaction", {
	id: uuid("id").defaultRandom().primaryKey(),
	resourceId: uuid("resourceId")
		.notNull()
		.references(() => resource.id, { onDelete: "cascade" }),
	borrowerId: text("borrowerId").references(() => user.id, {
		onDelete: "set null",
	}),
	lenderId: text("lenderId").references(() => user.id, {
		onDelete: "set null",
	}),
	status: text("status").$type<TransactionStatusEnum>().notNull(),
	startAt: timestamp("startAt").notNull(),
	endAt: timestamp("endAt"),
});

// --- Relations ---

export const usersRelations = relations(user, ({ many }) => ({
	sessions: many(session),
	accounts: many(account),
	pulses: many(pulse),
	skills: many(skill),
	resources: many(resource),
	quietHours: many(quietHours),
	conversations: many(conversationMember),
	messages: many(message),
	notifications: many(notification),
	pulseConfirmations: many(pulseConfirmation),
	responses: many(pulseResponse),
	reportsSent: many(report, { relationName: "reportsSent" }),
	reportsReceived: many(report, { relationName: "reportsReceived" }),
	borrowedTransactions: many(transaction, {
		relationName: "borrowedTransactions",
	}),
	lentTransactions: many(transaction, { relationName: "lentTransactions" }),
}));

export const sessionRelations = relations(session, ({ one }) => ({
	user: one(user, { fields: [session.userId], references: [user.id] }),
}));

export const accountRelations = relations(account, ({ one }) => ({
	user: one(user, { fields: [account.userId], references: [user.id] }),
}));

export const verificationRelations = relations(verification, () => ({}));

export const pulseRelations = relations(pulse, ({ one, many }) => ({
	user: one(user, { fields: [pulse.userId], references: [user.id] }),
	conversations: many(conversation),
	alerts: many(petAlert),
	confirmations: many(pulseConfirmation),
	responses: many(pulseResponse),
	reports: many(report),
}));

export const conversationRelations = relations(
	conversation,
	({ one, many }) => ({
		pulse: one(pulse, {
			fields: [conversation.pulseId],
			references: [pulse.id],
		}),
		messages: many(message),
		members: many(conversationMember),
	}),
);

export const conversationMemberRelations = relations(
	conversationMember,
	({ one }) => ({
		conversation: one(conversation, {
			fields: [conversationMember.conversationId],
			references: [conversation.id],
		}),
		user: one(user, {
			fields: [conversationMember.userId],
			references: [user.id],
		}),
	}),
);

export const messageRelations = relations(message, ({ one }) => ({
	conversation: one(conversation, {
		fields: [message.conversationId],
		references: [conversation.id],
	}),
	sender: one(user, { fields: [message.senderId], references: [user.id] }),
}));

export const notificationRelations = relations(notification, ({ one }) => ({
	user: one(user, { fields: [notification.userId], references: [user.id] }),
}));

export const petAlertRelations = relations(petAlert, ({ one, many }) => ({
	pulse: one(pulse, { fields: [petAlert.pulseId], references: [pulse.id] }),
	lostMatches: many(petMatch, { relationName: "lostMatches" }),
	foundMatches: many(petMatch, { relationName: "foundMatches" }),
}));

export const petMatchRelations = relations(petMatch, ({ one }) => ({
	lostAlert: one(petAlert, {
		fields: [petMatch.lostAlertId],
		references: [petAlert.id],
		relationName: "lostMatches",
	}),
	foundAlert: one(petAlert, {
		fields: [petMatch.foundAlertId],
		references: [petAlert.id],
		relationName: "foundMatches",
	}),
}));

export const pulseConfirmationRelations = relations(
	pulseConfirmation,
	({ one }) => ({
		pulse: one(pulse, {
			fields: [pulseConfirmation.pulseId],
			references: [pulse.id],
		}),
		user: one(user, {
			fields: [pulseConfirmation.userId],
			references: [user.id],
		}),
	}),
);

export const pulseResponseRelations = relations(pulseResponse, ({ one }) => ({
	pulse: one(pulse, {
		fields: [pulseResponse.pulseId],
		references: [pulse.id],
	}),
	user: one(user, {
		fields: [pulseResponse.responderId],
		references: [user.id],
	}),
}));

export const quietHoursRelations = relations(quietHours, ({ one }) => ({
	user: one(user, { fields: [quietHours.userId], references: [user.id] }),
}));

export const reportRelations = relations(report, ({ one }) => ({
	reporter: one(user, {
		fields: [report.reporterId],
		references: [user.id],
		relationName: "reportsSent",
	}),
	targetUser: one(user, {
		fields: [report.targetUserId],
		references: [user.id],
		relationName: "reportsReceived",
	}),
	targetPulse: one(pulse, {
		fields: [report.targetPulseId],
		references: [pulse.id],
	}),
}));

export const resourceRelations = relations(resource, ({ one, many }) => ({
	user: one(user, { fields: [resource.userId], references: [user.id] }),
	transactions: many(transaction),
}));

export const skillRelations = relations(skill, ({ one }) => ({
	user: one(user, { fields: [skill.userId], references: [user.id] }),
}));

export const transactionRelations = relations(transaction, ({ one }) => ({
	resource: one(resource, {
		fields: [transaction.resourceId],
		references: [resource.id],
	}),
	borrower: one(user, {
		fields: [transaction.borrowerId],
		references: [user.id],
		relationName: "borrowedTransactions",
	}),
	lender: one(user, {
		fields: [transaction.lenderId],
		references: [user.id],
		relationName: "lentTransactions",
	}),
}));

export type UserType = InferSelectModel<typeof user>;
export type SessionType = InferSelectModel<typeof session>;
export type AccountType = InferSelectModel<typeof account>;
export type VerificationType = InferSelectModel<typeof verification>;
export type PulseType = InferSelectModel<typeof pulse>;
export type ConversationType = InferSelectModel<typeof conversation>;
export type ConversationMemberType = InferSelectModel<
	typeof conversationMember
>;
export type MessageType = InferSelectModel<typeof message>;
export type NotificationType = InferSelectModel<typeof notification>;
export type PetAlertType = InferSelectModel<typeof petAlert>;
export type PetMatchType = InferSelectModel<typeof petMatch>;
export type PulseConfirmationType = InferSelectModel<typeof pulseConfirmation>;
export type PulseResponseType = InferSelectModel<typeof pulseResponse>;
export type QuietHoursType = InferSelectModel<typeof quietHours>;
export type ReportType = InferSelectModel<typeof report>;
export type ResourceType = InferSelectModel<typeof resource>;
export type SkillType = InferSelectModel<typeof skill>;
export type TransactionType = InferSelectModel<typeof transaction>;
