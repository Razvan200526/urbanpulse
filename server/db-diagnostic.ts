import { AppDataSource } from "./src/shared/PrimaryDatabase";

async function diagnostic() {
	console.log("Starting Database Diagnostic...");
	await AppDataSource.initialize();

	// 1. List all tables in the public schema
	const tables = await AppDataSource.query(`
		SELECT table_name 
		FROM information_schema.tables 
		WHERE table_schema = 'public'
		ORDER BY table_name;
	`);
	console.log("\nTables found in 'public' schema:");
	console.table(tables);

	// 2. Check row counts for auth-related tables
	const authTables = ["user", "session", "account", "verification"];
	console.log("\nRow counts:");
	for (const table of authTables) {
		try {
			const result = await AppDataSource.query(
				`SELECT COUNT(*) as count FROM "${table}"`,
			);
			console.log(`Table "${table}": ${result[0].count} rows`);
		} catch (e: any) {
			console.log(`Table "${table}": Error querying - ${e.message}`);
		}
	}

	// 3. Check for any table name variations (case sensitivity)
	const allTables = await AppDataSource.query(`
		SELECT tablename FROM pg_catalog.pg_tables 
		WHERE schemaname != 'pg_catalog' AND schemaname != 'information_schema'
	`);
	console.log("\nAll table names in DB (case-sensitive):");
	console.table(allTables);

	// 4. Verify foreign key data for the first account (if any)
	try {
		const accounts = await AppDataSource.query(
			`SELECT * FROM "account" LIMIT 1`,
		);
		if (accounts.length > 0) {
			console.log("\nSample Account data (first record):");
			console.log(JSON.stringify(accounts[0], null, 2));

			const userId = accounts[0].userId;
			const user = await AppDataSource.query(
				`SELECT * FROM "user" WHERE id = $1`,
				[userId],
			);
			console.log(
				`\nLinked User (id: ${userId}):`,
				user.length > 0 ? "FOUND" : "NOT FOUND",
			);
		}
	} catch (e: any) {
		console.log("\nError checking account-user link:", e.message);
	}

	await AppDataSource.destroy();
}

diagnostic().catch(console.error);
