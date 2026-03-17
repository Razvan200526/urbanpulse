import { AppDataSource } from "./src/shared/PrimaryDatabase";

async function check() {
	await AppDataSource.initialize();
	const extensions = await AppDataSource.query("SELECT * FROM pg_extension;");
	console.log(
		"Extensions:",
		extensions.map((e) => e.extname),
	);

	const searchPath = await AppDataSource.query("SHOW search_path;");
	console.log("Search Path:", searchPath);

	const types = await AppDataSource.query(
		"SELECT nspname, typname FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE typname = 'geography';",
	);
	console.log("Geography type info:", types);

	await AppDataSource.destroy();
}

check().catch(console.error);
