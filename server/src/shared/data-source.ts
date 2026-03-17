import { PrimaryEntities } from "@server/entities/PrimaryEntities";
import { DataSource } from "typeorm";

export const dataSource = new DataSource({
	type: "postgres",
	url: Bun.env.DATABASE_URL,
	synchronize: true,
	entities: PrimaryEntities,
	ssl: Bun.env.NODE_ENV === "production",
});
