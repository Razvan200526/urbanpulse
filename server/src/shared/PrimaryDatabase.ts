import {
	DataSource,
	type EntityManager,
	type EntityTarget,
	type ObjectLiteral,
	type Repository,
} from "typeorm";
import { PrimaryEntities } from "../entities/PrimaryEntities";
import { logger } from "@server/utils/Logger";

export class PrimaryDatabase {
	private source: DataSource | null = null;
	private readonly url: string;

	constructor() {
		const dbUrl = Bun.env.DATABASE_URL;
		this.url = dbUrl;
	}

	public getSource(): DataSource {
		if (this.source) {
			return this.source;
		}

		this.source = new DataSource({
			type: "postgres",
			url: this.url,
			synchronize: true,
			entities: PrimaryEntities,
			ssl: Bun.env.NODE_ENV === "production",
		});
		logger.info("Database source initalized");
		return this.source;
	}

	public async open<Entity extends ObjectLiteral>(
		entity: EntityTarget<Entity>,
	): Promise<Repository<Entity>> {
		const source = this.getSource();

		if (!source.isInitialized) {
			await source.initialize();
		}

		return source.getRepository(entity);
	}

	public async close(): Promise<void> {
		const source = this.getSource();
		if (source.isInitialized) {
			await source.destroy();
		}
	}

	public getEntityManager(): EntityManager {
		return this.getSource().manager;
	}
}

export const primaryDatabase = new PrimaryDatabase();
