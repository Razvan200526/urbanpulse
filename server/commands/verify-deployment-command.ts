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

function normalizeBaseUrl(url: string) {
	if (url.startsWith("http://") || url.startsWith("https://")) {
		return url;
	}

	return `https://${url}`;
}

function getRequiredUrl(
	name: string,
	...candidates: Array<string | undefined>
) {
	const value = candidates.find(
		(candidate) => candidate && candidate.length > 0,
	);

	if (!value) {
		throw new Error(
			`Missing ${name}. Set one of the expected deployment verification environment variables before running this command.`,
		);
	}

	return normalizeBaseUrl(value);
}

async function expectStatusOk(label: string, url: string) {
	const response = await fetch(url);

	if (response.status !== 200) {
		throw new Error(`${label} returned ${response.status} for ${url}.`);
	}

	console.log(
		p.magentaBright(`${figures.tick} ${label} returned 200 (${url})`),
	);
}

try {
	const webUrl = getRequiredUrl(
		"deploy web URL",
		process.env.DEPLOY_CHECK_WEB_URL,
		process.env.CLIENT_URL,
	);
	const serverUrl = getRequiredUrl(
		"deploy server URL",
		process.env.DEPLOY_CHECK_SERVER_URL,
		process.env.SERVER_URL,
	);
	const aiUrl = getRequiredUrl(
		"deploy AI URL",
		process.env.DEPLOY_CHECK_AI_URL,
		process.env.AI_PUBLIC_URL,
		process.env.VITE_AI_URL,
		process.env.RAILWAY_SERVICE_AI_URL,
	);

	await expectStatusOk("Pages homepage", webUrl);
	await expectStatusOk("Server health", `${serverUrl}/api/health`);
	await expectStatusOk("AI health", `${aiUrl}/health`);

	const connection = createDatabaseClient();

	try {
		const installedExtensions =
			await assertRequiredDatabaseExtensions(connection);
		const smokeResults = await runDatabaseSmokeChecks(connection);
		console.log(
			p.magentaBright(
				`${figures.tick} Database verified (${installedExtensions.join(", ")}, PostGIS=${smokeResults.point}, vector=${smokeResults.vectorColumnType})`,
			),
		);
	} finally {
		await connection.end();
	}
} catch (error) {
	if (error instanceof Error) {
		console.error(pe.render(error));
	} else {
		console.error(error);
	}
	process.exit(1);
}

process.exit();
