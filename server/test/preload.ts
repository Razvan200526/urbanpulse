import { afterAll } from "bun:test";
import {
	disposeRunDatabase,
	initializeRunDatabase,
} from "./helpers/testDatabase";

const databaseUrl =
	process.env.DATABASE_URL ??
	"postgresql://urbanpulse:urbanpulse@localhost:5433/urbanpulse_test";

process.env.DATABASE_URL = databaseUrl;
Bun.env.DATABASE_URL = databaseUrl;

const shouldManageDocker = process.env.TEST_DB_MANAGED_EXTERNALLY !== "1";

if (shouldManageDocker) {
	const result = Bun.spawnSync({
		cmd: [
			"docker",
			"compose",
			"-f",
			"../docker-compose.test.yaml",
			"up",
			"-d",
			"--wait",
		],
		cwd: import.meta.dir + "/..",
		stdout: "inherit",
		stderr: "inherit",
	});

	if (result.exitCode !== 0) {
		throw new Error("Failed to start the Docker test database.");
	}
}

await initializeRunDatabase();

afterAll(async () => {
	await disposeRunDatabase();

	if (shouldManageDocker) {
		Bun.spawnSync({
			cmd: ["docker", "compose", "-f", "../docker-compose.test.yaml", "down"],
			cwd: import.meta.dir + "/..",
			stdout: "inherit",
			stderr: "inherit",
		});
	}
});
