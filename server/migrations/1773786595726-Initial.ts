import type { MigrationInterface, QueryRunner } from "typeorm";

export class Initial1773786595726 implements MigrationInterface {
	name = "Initial1773786595726";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "pulse" ALTER COLUMN "position" TYPE point`,
		);
		await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "name"`);
		await queryRunner.query(
			`ALTER TABLE "user" ADD "name" character varying(255) NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "user" DROP CONSTRAINT "user_email_key"`,
		);
		await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "email"`);
		await queryRunner.query(
			`ALTER TABLE "user" ADD "email" character varying(255) NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "user" ADD CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email")`,
		);
		await queryRunner.query(
			`ALTER TABLE "user" ALTER COLUMN "emailVerified" SET DEFAULT false`,
		);
		await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "image"`);
		await queryRunner.query(`ALTER TABLE "user" ADD "image" character varying`);
		await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "createdAt"`);
		await queryRunner.query(
			`ALTER TABLE "user" ADD "createdAt" TIMESTAMP NOT NULL`,
		);
		await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "updatedAt"`);
		await queryRunner.query(
			`ALTER TABLE "user" ADD "updatedAt" TIMESTAMP NOT NULL`,
		);
		await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "role"`);
		await queryRunner.query(
			`CREATE TYPE "public"."user_role_enum" AS ENUM('admin', 'user')`,
		);
		await queryRunner.query(
			`ALTER TABLE "user" ADD "role" "public"."user_role_enum" NOT NULL DEFAULT 'user'`,
		);
		await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "bio"`);
		await queryRunner.query(
			`ALTER TABLE "user" ADD "bio" character varying(100)`,
		);
		await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "trustScore"`);
		await queryRunner.query(
			`ALTER TABLE "user" ADD "trustScore" real NOT NULL DEFAULT '0'`,
		);
		await queryRunner.query(
			`ALTER TABLE "user" ALTER COLUMN "successfulInteractions" SET NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "user" ALTER COLUMN "successfulInteractions" SET DEFAULT '0'`,
		);
		await queryRunner.query(
			`ALTER TABLE "user" ALTER COLUMN "isVerified" SET NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "user" ALTER COLUMN "isVerified" SET DEFAULT false`,
		);
		await queryRunner.query(
			`ALTER TABLE "user" ALTER COLUMN "rememberMe" SET NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "user" ALTER COLUMN "rememberMe" SET DEFAULT false`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "user" ALTER COLUMN "rememberMe" DROP DEFAULT`,
		);
		await queryRunner.query(
			`ALTER TABLE "user" ALTER COLUMN "rememberMe" DROP NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "user" ALTER COLUMN "isVerified" DROP DEFAULT`,
		);
		await queryRunner.query(
			`ALTER TABLE "user" ALTER COLUMN "isVerified" DROP NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "user" ALTER COLUMN "successfulInteractions" DROP DEFAULT`,
		);
		await queryRunner.query(
			`ALTER TABLE "user" ALTER COLUMN "successfulInteractions" DROP NOT NULL`,
		);
		await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "trustScore"`);
		await queryRunner.query(`ALTER TABLE "user" ADD "trustScore" integer`);
		await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "bio"`);
		await queryRunner.query(`ALTER TABLE "user" ADD "bio" text`);
		await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "role"`);
		await queryRunner.query(`DROP TYPE "public"."user_role_enum"`);
		await queryRunner.query(`ALTER TABLE "user" ADD "role" text`);
		await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "updatedAt"`);
		await queryRunner.query(
			`ALTER TABLE "user" ADD "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP`,
		);
		await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "createdAt"`);
		await queryRunner.query(
			`ALTER TABLE "user" ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP`,
		);
		await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "image"`);
		await queryRunner.query(`ALTER TABLE "user" ADD "image" text`);
		await queryRunner.query(
			`ALTER TABLE "user" ALTER COLUMN "emailVerified" DROP DEFAULT`,
		);
		await queryRunner.query(
			`ALTER TABLE "user" DROP CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22"`,
		);
		await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "email"`);
		await queryRunner.query(`ALTER TABLE "user" ADD "email" text NOT NULL`);
		await queryRunner.query(
			`ALTER TABLE "user" ADD CONSTRAINT "user_email_key" UNIQUE ("email")`,
		);
		await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "name"`);
		await queryRunner.query(`ALTER TABLE "user" ADD "name" text NOT NULL`);
		await queryRunner.query(
			`ALTER TABLE "pulse" ALTER COLUMN "position" TYPE point`,
		);
	}
}
