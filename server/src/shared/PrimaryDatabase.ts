import {
	DataSource,
	type EntityManager,
	type EntityTarget,
	type ObjectLiteral,
	type Repository,
} from "typeorm";

export const AppDataSource = new DataSource({
	type: "postgres",
	url: Bun.env.DATABASE_URL,
	synchronize: false,
	entities: ["./src/entities/*.ts"],
	ssl: Bun.env.NODE_ENV === "production",
	migrations: ["./migrations/*.ts"],
});

export class PrimaryDatabase {
	private source: DataSource = AppDataSource;

	public getSource(): DataSource {
		return this.source;
	}

	public async open<Entity extends ObjectLiteral>(
		entity: EntityTarget<Entity>,
	): Promise<Repository<Entity>> {
		if (!this.source.isInitialized) {
			await this.source.initialize();
		}

		return this.source.getRepository(entity);
	}

	public async close(): Promise<void> {
		if (this.source.isInitialized) {
			await this.source.destroy();
		}
	}

	public getEntityManager(): EntityManager {
		return this.source.manager;
	}
}

export const primaryDatabase = new PrimaryDatabase();
