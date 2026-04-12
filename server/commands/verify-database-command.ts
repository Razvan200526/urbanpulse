/** biome-ignore-all lint/suspicious/noConsole: <should log> */
import {
	assertRequiredDatabaseExtensions,
	createDatabaseClient,
	runDatabaseSmokeChecks,
} from "@server/db/contract";
import figures from "figures";
import * as p from "picocolors";
import PrettyError from "pretty-error";

const pe = new PrettyError();
const shouldRunSmokeChecks = Bun.argv.includes("--smoke");

try {
	const connection = createDatabaseClient();

	try {
		const installedExtensions =
			await assertRequiredDatabaseExtensions(connection);
		console.log(
			p.magentaBright(
				`${figures.tick} Verified database extensions: ${installedExtensions.join(", ")}`,
			),
		);

		if (shouldRunSmokeChecks) {
			const results = await runDatabaseSmokeChecks(connection);
			console.log(
				p.magentaBright(
					`${figures.tick} Startup smoke checks passed (PostGIS=${results.point}, vector=${results.vectorColumnType})`,
				),
			);
		}
	} finally {
		await connection.end();
	}
} catch (error) {
	if (error instanceof Error) {
		console.error(pe.render(error));
	}
	process.exit(1);
}

process.exit();
