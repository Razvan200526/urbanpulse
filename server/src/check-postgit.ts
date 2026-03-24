import { sql } from "drizzle-orm";
import { db } from "./db/index.js";

async function checkPostgis() {
	try {
		const result = await db.execute(sql`SELECT postgis_full_version()`);
		console.log("✅ PostGIS is installed!");
		console.log(result.rows[0]);
	} catch (error) {
		console.error("❌ PostGIS is NOT installed");
		console.error(error);
	}
}

checkPostgis();
