import { auth } from "./src/services/auth/AuthService";

async function run() {
	try {
		console.log("Checking adapter directly:");
        // Using the raw adapter passed into Better Auth
		const dbAdapter = (auth as any).options.database;
		if (dbAdapter) {
			console.log(
				"Looking up user by email asdlknadslksa@gmail.com:",
			);
			const user = await dbAdapter.findOne({
				model: "user",
				where: [{ field: "email", value: "asdlknadslksa@gmail.com" }],
			});
			console.log("Result:", user);

			const account = await dbAdapter.findOne({
				model: "account",
				where: [{ field: "userId", value: "xviiQ4pTTSVhRlYe3zNe6FSHwx6WWpmU" }],
			});
			console.log("Account:", account);
		}
	} catch (err) {
		console.error(err);
	}
	process.exit(0);
}

run();
