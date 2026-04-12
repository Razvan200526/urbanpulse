import postgres from "postgres";

export const REQUIRED_DATABASE_EXTENSIONS = ["postgis", "vector"] as const;

export type DatabaseClient = ReturnType<typeof postgres>;

export function getDatabaseUrl() {
	const databaseUrl = Bun.env.DATABASE_URL ?? process.env.DATABASE_URL;

	if (!databaseUrl) {
		throw new Error("DATABASE_URL is required.");
	}

	return databaseUrl;
}

export function createDatabaseClient(databaseUrl = getDatabaseUrl()) {
	return postgres(databaseUrl, {
		max: 1,
		onnotice: () => {},
	});
}

export async function bootstrapDatabaseExtensions(client: DatabaseClient) {
	for (const extension of REQUIRED_DATABASE_EXTENSIONS) {
		await client.unsafe(`CREATE EXTENSION IF NOT EXISTS ${extension}`);
	}
}

export async function assertRequiredDatabaseExtensions(client: DatabaseClient) {
	const installedExtensions = await client<{ extname: string }[]>`
		SELECT extname
		FROM pg_extension
		WHERE extname IN ('postgis', 'vector')
		ORDER BY extname
	`;
	const installedExtensionNames = new Set(
		installedExtensions.map((extension) => extension.extname),
	);
	const missingExtensions = REQUIRED_DATABASE_EXTENSIONS.filter(
		(extension) => !installedExtensionNames.has(extension),
	);

	if (missingExtensions.length > 0) {
		throw new Error(
			`Missing required database extensions: ${missingExtensions.join(", ")}.`,
		);
	}

	return [...installedExtensionNames];
}

export async function runDatabaseSmokeChecks(client: DatabaseClient) {
	const pointRows = await client<{ point: string }[]>`
		SELECT ST_AsText(ST_SetSRID(ST_MakePoint(-73.9857, 40.7484), 4326)) AS point
	`;
	const point = pointRows[0]?.point;

	if (!point?.startsWith("POINT(")) {
		throw new Error(
			`PostGIS smoke test returned an unexpected point payload: ${point ?? "null"}.`,
		);
	}

	const vectorSimilarityRows = await client<{ similarity: number }[]>`
		SELECT ('[1,0,0]'::vector(3) <=> '[1,0,0]'::vector(3))::float8 AS similarity
	`;
	const similarity = vectorSimilarityRows[0]?.similarity;

	if (similarity !== 0) {
		throw new Error(
			`Vector smoke test returned an unexpected similarity score: ${similarity ?? "null"}.`,
		);
	}

	const vectorColumnRows = await client<{ columnType: string | null }[]>`
		SELECT format_type(a.atttypid, a.atttypmod) AS "columnType"
		FROM pg_attribute a
		INNER JOIN pg_class c ON c.oid = a.attrelid
		INNER JOIN pg_namespace n ON n.oid = c.relnamespace
		WHERE n.nspname = 'public'
			AND c.relname = 'pet_alert'
			AND a.attname = 'imageEmbedding'
			AND NOT a.attisdropped
		LIMIT 1
	`;
	const vectorColumnType = vectorColumnRows[0]?.columnType;

	if (vectorColumnType !== "vector(768)") {
		throw new Error(
			`Expected public.pet_alert.imageEmbedding to use vector(768), got ${vectorColumnType ?? "null"}.`,
		);
	}

	return {
		point,
		similarity,
		vectorColumnType,
	};
}
