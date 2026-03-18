import { type MigrationInterface, type QueryRunner } from "typeorm";

export class Initial1773853647369 implements MigrationInterface {
	name = "Initial1773853647369";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "pulse" ALTER COLUMN "position" TYPE point`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "pulse" ALTER COLUMN "position" TYPE point`,
		);
	}
}
