import type { MigrationInterface, QueryRunner } from "typeorm";

export class Initial1773786756167 implements MigrationInterface {
	name = "Initial1773786756167";

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
