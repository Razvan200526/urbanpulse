import * as schema from "@server/db/schema";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { reset } from "drizzle-seed";
import {
	accountSeeds,
	conversationMemberSeeds,
	conversationSeeds,
	messageSeeds,
	notificationSeeds,
	petAlertSeeds,
	petMatchSeeds,
	pulseConfirmationSeeds,
	pulseSeeds,
	quietHoursSeeds,
	reportSeeds,
	resourceSeeds,
	responseSeeds,
	sessionSeeds,
	skillSeeds,
	transactionSeeds,
	userSeeds,
	verificationSeeds,
} from "./tables";

type SeedDatabase = PostgresJsDatabase<typeof schema>;

export async function seedDatabase(db: SeedDatabase) {
	await reset(db, schema);

	await db.transaction(async (tx) => {
		await tx.insert(schema.user).values(userSeeds);
		await tx.insert(schema.account).values(accountSeeds);
		await tx.insert(schema.session).values(sessionSeeds);
		await tx.insert(schema.verification).values(verificationSeeds);

		await tx.insert(schema.pulse).values(pulseSeeds);
		await tx.insert(schema.conversation).values(conversationSeeds);
		await tx.insert(schema.conversationMember).values(conversationMemberSeeds);
		await tx.insert(schema.message).values(messageSeeds);

		await tx.insert(schema.petAlert).values(petAlertSeeds);
		await tx.insert(schema.petMatch).values(petMatchSeeds);
		await tx.insert(schema.pulseConfirmation).values(pulseConfirmationSeeds);
		await tx.insert(schema.pulseResponse).values(responseSeeds);

		await tx.insert(schema.report).values(reportSeeds);
		await tx.insert(schema.resource).values(resourceSeeds);
		await tx.insert(schema.skill).values(skillSeeds);
		await tx.insert(schema.transaction).values(transactionSeeds);

		await tx.insert(schema.notification).values(notificationSeeds);
		await tx.insert(schema.quietHours).values(quietHoursSeeds);
	});
}
