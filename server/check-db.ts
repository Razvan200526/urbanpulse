import { db } from "./src/db/index";
import { account, user } from "./src/db/schema";

async function run() {
	try {
		console.log("Fetching all users...");
		const users = await db.select().from(user);
		console.log("Users in DB:", users);

		console.log("Fetching all accounts...");
		const accounts = await db.select().from(account);
		console.log("Accounts in DB:", accounts);
	} catch (error) {
		console.error("DB Query failed:", error);
	}
	process.exit(0);
}

run();
