import { MigrationInterface, QueryRunner } from "typeorm";

export class AddQuietHoursForeignKey1773853766867
	implements MigrationInterface
{
	name = "AddQuietHoursForeignKey1773853766867";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name = 'quiet_hours' AND column_name = 'userId'
                ) THEN
                    ALTER TABLE "quiet_hours" ADD COLUMN "userId" text NOT NULL;
                END IF;
            END $$;
        `);

		await queryRunner.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.table_constraints
                    WHERE constraint_name = 'FK_quiet_hours_userId'
                    AND table_name = 'quiet_hours'
                ) THEN
                    ALTER TABLE "quiet_hours"
                    ADD CONSTRAINT "FK_quiet_hours_userId"
                    FOREIGN KEY ("userId")
                    REFERENCES "user"("id")
                    ON DELETE CASCADE
                    ON UPDATE NO ACTION;
                END IF;
            END $$;
        `);

		await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_quiet_hours_userId" ON "quiet_hours" ("userId")
        `);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP INDEX IF EXISTS "IDX_quiet_hours_userId"`);

		await queryRunner.query(`
            ALTER TABLE "quiet_hours" DROP CONSTRAINT IF EXISTS "FK_quiet_hours_userId"
        `);
	}
}
