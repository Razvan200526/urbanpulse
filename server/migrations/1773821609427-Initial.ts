import { MigrationInterface, QueryRunner } from "typeorm";

export class Initial1773821609427 implements MigrationInterface {
    name = 'Initial1773821609427'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "skill" ("id" uuid NOT NULL, "tag" text NOT NULL, "userId" text, CONSTRAINT "PK_a0d33334424e64fb78dc3ce7196" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "pulse" ALTER COLUMN "position" TYPE point`);
        await queryRunner.query(`ALTER TABLE "skill" ADD CONSTRAINT "FK_c08612011a88745a32784544b28" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "skill" DROP CONSTRAINT "FK_c08612011a88745a32784544b28"`);
        await queryRunner.query(`ALTER TABLE "pulse" ALTER COLUMN "position" TYPE point`);
        await queryRunner.query(`DROP TABLE "skill"`);
    }

}
