/** biome-ignore-all lint/suspicious/noConsole: test runner */
import { readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const serverRoot = process.cwd();
const servicesRoot = join(serverRoot, "test/services");
const databaseUrl =
	process.env.DATABASE_URL ??
	"postgresql://urbanpulse:urbanpulse@localhost:5433/urbanpulse_test";
const shouldManageDocker = process.env.TEST_DB_MANAGED_EXTERNALLY !== "1";

const isTestFile = (filePath: string) =>
	filePath.endsWith(".test.ts") ||
	filePath.endsWith(".test.tsx") ||
	filePath.endsWith(".spec.ts") ||
	filePath.endsWith(".spec.tsx");

const collectTestFiles = (dir: string): string[] => {
	return readdirSync(dir).flatMap((entry) => {
		const fullPath = join(dir, entry);
		const stats = statSync(fullPath);

		if (stats.isDirectory()) {
			return collectTestFiles(fullPath);
		}

		return isTestFile(fullPath) ? [fullPath] : [];
	});
};

const testFiles = collectTestFiles(servicesRoot).sort();

if (testFiles.length === 0) {
	console.log("No service test files found.");
	process.exit(0);
}

const runDockerCompose = (args: string[]) => {
	const result = Bun.spawnSync({
		cmd: ["docker", "compose", "-f", "../docker-compose.test.yaml", ...args],
		cwd: serverRoot,
		stdout: "inherit",
		stderr: "inherit",
	});

	if (result.exitCode !== 0) {
		throw new Error(`docker compose ${args.join(" ")} failed`);
	}
};

let hasFailures = false;

try {
	if (shouldManageDocker) {
		runDockerCompose(["up", "-d", "--wait"]);
	}

	for (const testFile of testFiles) {
		const displayPath = relative(serverRoot, testFile);
		const testPath = `./${displayPath}`;
		console.log(`\nRunning ${displayPath}`);

		const proc = Bun.spawn(["bun", "test", testPath], {
			cwd: serverRoot,
			env: {
				...process.env,
				DATABASE_URL: databaseUrl,
				TEST_DB_MANAGED_EXTERNALLY: "1",
			},
			stdio: ["inherit", "inherit", "inherit"],
		});

		const exitCode = await proc.exited;
		if (exitCode !== 0) {
			hasFailures = true;
		}
	}
} finally {
	if (shouldManageDocker) {
		try {
			runDockerCompose(["down"]);
		} catch (error) {
			console.error(error);
			hasFailures = true;
		}
	}
}

process.exit(hasFailures ? 1 : 0);
