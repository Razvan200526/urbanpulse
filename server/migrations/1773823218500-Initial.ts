import { type MigrationInterface, type QueryRunner } from "typeorm";

export class Initial1773823218500 implements MigrationInterface {
	name = "Initial1773823218500";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`CREATE TYPE "public"."resources_availability_enum" AS ENUM('Available', 'Unavailable', 'Currently Unavailable')`,
		);
		await queryRunner.query(
			`CREATE TABLE "resources" ("id" uuid NOT NULL, "name" text NOT NULL, "description" text, "availability" "public"."resources_availability_enum" NOT NULL, "createdAt" TIMESTAMP NOT NULL, "userId" text, CONSTRAINT "PK_632484ab9dff41bba94f9b7c85e" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(
			`CREATE TYPE "public"."notification_type_enum" AS ENUM('HERO_ALERT', 'PULSE_CONFIRMED', 'MESSAGE', 'TRANSACTION', 'FEEDBACK')`,
		);
		await queryRunner.query(
			`CREATE TABLE "notification" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" "public"."notification_type_enum" NOT NULL, "payload" jsonb NOT NULL, "read" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL, "userId" text, CONSTRAINT "PK_705b6c7cdf9b2c2ff7ac7872cb7" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(
			`CREATE TYPE "public"."transaction_status_enum" AS ENUM('PENDING', 'ACTIVE', 'COMPLETED', 'CANCELLED')`,
		);
		await queryRunner.query(
			`CREATE TABLE "transaction" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "status" "public"."transaction_status_enum" NOT NULL, "startAt" TIMESTAMP WITH TIME ZONE NOT NULL, "endAt" TIMESTAMP WITH TIME ZONE, "resourceId" uuid, "borrowerId" text, "lenderId" text, CONSTRAINT "PK_89eadb93a89810556e1cbcd6ab9" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(
			`CREATE TABLE "feedback" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "rating" smallint NOT NULL, "comment" text, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL, "transactionId" uuid, "reviewerId" text, "revieweeId" text, CONSTRAINT "PK_8389f9e087a57689cd5be8b2b13" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(
			`CREATE TYPE "public"."report_status_enum" AS ENUM('PENDING', 'RESOLVED', 'DISMISSED')`,
		);
		await queryRunner.query(
			`CREATE TABLE "report" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "reason" text NOT NULL, "status" "public"."report_status_enum" NOT NULL DEFAULT 'PENDING', "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL, "reporterId" text, "targetUserId" text, "targetPulseId" uuid, CONSTRAINT "PK_99e4d0bea58cba73c57f935a546" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(
			`CREATE TABLE "pet_alert" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "petType" text NOT NULL, "color" text NOT NULL, "breed" text, "imageUrl" text, "aiDescriptor" text, "pulseId" uuid, CONSTRAINT "REL_238a0c916ba64f996e6dfb1df2" UNIQUE ("pulseId"), CONSTRAINT "PK_2e13a7cf1ddafdf6695346d35e6" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(
			`CREATE TABLE "pet_match" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "confidenceScore" double precision NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL, "lostAlertId" uuid, "foundAlertId" uuid, CONSTRAINT "PK_ff08dd22124ddb8af5598322c79" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(
			`CREATE TABLE "pulse_confirmation" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "confirmedAt" TIMESTAMP WITH TIME ZONE NOT NULL, "pulseId" uuid, "userId" text, CONSTRAINT "PK_80f673f6df4bd3746d25c41a4f5" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(
			`CREATE TABLE "quiet_hours" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "startTime" TIME NOT NULL, "endTime" TIME NOT NULL, "days" text NOT NULL, "userId" text, CONSTRAINT "PK_631524fde77e06374930a8ac4d4" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(
			`CREATE TABLE "message" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "content" text NOT NULL, "sentAt" TIMESTAMP WITH TIME ZONE NOT NULL, "conversationId" uuid, "senderId" text, CONSTRAINT "PK_ba01f0a3e0123651915008bc578" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(
			`CREATE TABLE "conversation_member" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "conversationId" uuid, "userId" text, CONSTRAINT "PK_ed07d3bc360f4e68836841b8358" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(
			`CREATE TYPE "public"."conversation_type_enum" AS ENUM('DIRECT', 'GROUP', 'PULSE')`,
		);
		await queryRunner.query(
			`CREATE TABLE "conversation" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" "public"."conversation_type_enum" NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL, "pulseId" uuid, CONSTRAINT "PK_864528ec4274360a40f66c29845" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(
			`CREATE TYPE "public"."response_status_enum" AS ENUM('PENDING', 'ACCEPTED', 'DECLINED', 'COMPLETED')`,
		);
		await queryRunner.query(
			`CREATE TABLE "response" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "status" "public"."response_status_enum" NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL, "pulseId" uuid, "responderId" text, CONSTRAINT "PK_f64544baf2b4dc48ba623ce768f" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(
			`ALTER TABLE "pulse" ALTER COLUMN "position" TYPE point`,
		);
		await queryRunner.query(
			`ALTER TABLE "resources" ADD CONSTRAINT "FK_50a0b3ca64c877ed82ceb871830" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "notification" ADD CONSTRAINT "FK_1ced25315eb974b73391fb1c81b" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "transaction" ADD CONSTRAINT "FK_709635cf85656dddade8521a38b" FOREIGN KEY ("resourceId") REFERENCES "resources"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "transaction" ADD CONSTRAINT "FK_421142a3c4f82dcf0cbe7aa9da8" FOREIGN KEY ("borrowerId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "transaction" ADD CONSTRAINT "FK_e29cd30713ab5c07f3d9a3dfd55" FOREIGN KEY ("lenderId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "feedback" ADD CONSTRAINT "FK_4bd4c7a1fd97604df4f65f5123e" FOREIGN KEY ("transactionId") REFERENCES "transaction"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "feedback" ADD CONSTRAINT "FK_86da0bc0ecaa123fb5b56a58588" FOREIGN KEY ("reviewerId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "feedback" ADD CONSTRAINT "FK_41885228cdba7016b5b4a618975" FOREIGN KEY ("revieweeId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "report" ADD CONSTRAINT "FK_253163ca85b927f62596606f6cc" FOREIGN KEY ("reporterId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "report" ADD CONSTRAINT "FK_ac3132b0a90a65fe792215be83b" FOREIGN KEY ("targetUserId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "report" ADD CONSTRAINT "FK_aa21545feeabd7f77661b59ead9" FOREIGN KEY ("targetPulseId") REFERENCES "pulse"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "pet_alert" ADD CONSTRAINT "FK_238a0c916ba64f996e6dfb1df26" FOREIGN KEY ("pulseId") REFERENCES "pulse"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "pet_match" ADD CONSTRAINT "FK_c43c83749407006321e0d9afa61" FOREIGN KEY ("lostAlertId") REFERENCES "pet_alert"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "pet_match" ADD CONSTRAINT "FK_083344851eac6290d1d787e763f" FOREIGN KEY ("foundAlertId") REFERENCES "pet_alert"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "pulse_confirmation" ADD CONSTRAINT "FK_7710af1cca20cb322c3c43c740b" FOREIGN KEY ("pulseId") REFERENCES "pulse"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "pulse_confirmation" ADD CONSTRAINT "FK_fb74034168b3c5ef4d22721555f" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "quiet_hours" ADD CONSTRAINT "FK_69eacbc9bee7b4582889f1b67f1" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "message" ADD CONSTRAINT "FK_7cf4a4df1f2627f72bf6231635f" FOREIGN KEY ("conversationId") REFERENCES "conversation"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "message" ADD CONSTRAINT "FK_bc096b4e18b1f9508197cd98066" FOREIGN KEY ("senderId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "conversation_member" ADD CONSTRAINT "FK_b15b0ed425fb8a2928f16db6fc8" FOREIGN KEY ("conversationId") REFERENCES "conversation"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "conversation_member" ADD CONSTRAINT "FK_dd563b686e428caa50c69ca5e1e" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "conversation" ADD CONSTRAINT "FK_b32425a7db52eb57835e1ba7938" FOREIGN KEY ("pulseId") REFERENCES "pulse"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "response" ADD CONSTRAINT "FK_e88741c690cf5cce540153168ba" FOREIGN KEY ("pulseId") REFERENCES "pulse"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "response" ADD CONSTRAINT "FK_a8ec3b865eb4b68e03c89bd53ca" FOREIGN KEY ("responderId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "response" DROP CONSTRAINT "FK_a8ec3b865eb4b68e03c89bd53ca"`,
		);
		await queryRunner.query(
			`ALTER TABLE "response" DROP CONSTRAINT "FK_e88741c690cf5cce540153168ba"`,
		);
		await queryRunner.query(
			`ALTER TABLE "conversation" DROP CONSTRAINT "FK_b32425a7db52eb57835e1ba7938"`,
		);
		await queryRunner.query(
			`ALTER TABLE "conversation_member" DROP CONSTRAINT "FK_dd563b686e428caa50c69ca5e1e"`,
		);
		await queryRunner.query(
			`ALTER TABLE "conversation_member" DROP CONSTRAINT "FK_b15b0ed425fb8a2928f16db6fc8"`,
		);
		await queryRunner.query(
			`ALTER TABLE "message" DROP CONSTRAINT "FK_bc096b4e18b1f9508197cd98066"`,
		);
		await queryRunner.query(
			`ALTER TABLE "message" DROP CONSTRAINT "FK_7cf4a4df1f2627f72bf6231635f"`,
		);
		await queryRunner.query(
			`ALTER TABLE "quiet_hours" DROP CONSTRAINT "FK_69eacbc9bee7b4582889f1b67f1"`,
		);
		await queryRunner.query(
			`ALTER TABLE "pulse_confirmation" DROP CONSTRAINT "FK_fb74034168b3c5ef4d22721555f"`,
		);
		await queryRunner.query(
			`ALTER TABLE "pulse_confirmation" DROP CONSTRAINT "FK_7710af1cca20cb322c3c43c740b"`,
		);
		await queryRunner.query(
			`ALTER TABLE "pet_match" DROP CONSTRAINT "FK_083344851eac6290d1d787e763f"`,
		);
		await queryRunner.query(
			`ALTER TABLE "pet_match" DROP CONSTRAINT "FK_c43c83749407006321e0d9afa61"`,
		);
		await queryRunner.query(
			`ALTER TABLE "pet_alert" DROP CONSTRAINT "FK_238a0c916ba64f996e6dfb1df26"`,
		);
		await queryRunner.query(
			`ALTER TABLE "report" DROP CONSTRAINT "FK_aa21545feeabd7f77661b59ead9"`,
		);
		await queryRunner.query(
			`ALTER TABLE "report" DROP CONSTRAINT "FK_ac3132b0a90a65fe792215be83b"`,
		);
		await queryRunner.query(
			`ALTER TABLE "report" DROP CONSTRAINT "FK_253163ca85b927f62596606f6cc"`,
		);
		await queryRunner.query(
			`ALTER TABLE "feedback" DROP CONSTRAINT "FK_41885228cdba7016b5b4a618975"`,
		);
		await queryRunner.query(
			`ALTER TABLE "feedback" DROP CONSTRAINT "FK_86da0bc0ecaa123fb5b56a58588"`,
		);
		await queryRunner.query(
			`ALTER TABLE "feedback" DROP CONSTRAINT "FK_4bd4c7a1fd97604df4f65f5123e"`,
		);
		await queryRunner.query(
			`ALTER TABLE "transaction" DROP CONSTRAINT "FK_e29cd30713ab5c07f3d9a3dfd55"`,
		);
		await queryRunner.query(
			`ALTER TABLE "transaction" DROP CONSTRAINT "FK_421142a3c4f82dcf0cbe7aa9da8"`,
		);
		await queryRunner.query(
			`ALTER TABLE "transaction" DROP CONSTRAINT "FK_709635cf85656dddade8521a38b"`,
		);
		await queryRunner.query(
			`ALTER TABLE "notification" DROP CONSTRAINT "FK_1ced25315eb974b73391fb1c81b"`,
		);
		await queryRunner.query(
			`ALTER TABLE "resources" DROP CONSTRAINT "FK_50a0b3ca64c877ed82ceb871830"`,
		);
		await queryRunner.query(
			`ALTER TABLE "pulse" ALTER COLUMN "position" TYPE point`,
		);
		await queryRunner.query(`DROP TABLE "response"`);
		await queryRunner.query(`DROP TYPE "public"."response_status_enum"`);
		await queryRunner.query(`DROP TABLE "conversation"`);
		await queryRunner.query(`DROP TYPE "public"."conversation_type_enum"`);
		await queryRunner.query(`DROP TABLE "conversation_member"`);
		await queryRunner.query(`DROP TABLE "message"`);
		await queryRunner.query(`DROP TABLE "quiet_hours"`);
		await queryRunner.query(`DROP TABLE "pulse_confirmation"`);
		await queryRunner.query(`DROP TABLE "pet_match"`);
		await queryRunner.query(`DROP TABLE "pet_alert"`);
		await queryRunner.query(`DROP TABLE "report"`);
		await queryRunner.query(`DROP TYPE "public"."report_status_enum"`);
		await queryRunner.query(`DROP TABLE "feedback"`);
		await queryRunner.query(`DROP TABLE "transaction"`);
		await queryRunner.query(`DROP TYPE "public"."transaction_status_enum"`);
		await queryRunner.query(`DROP TABLE "notification"`);
		await queryRunner.query(`DROP TYPE "public"."notification_type_enum"`);
		await queryRunner.query(`DROP TABLE "resources"`);
		await queryRunner.query(`DROP TYPE "public"."resources_availability_enum"`);
	}
}
