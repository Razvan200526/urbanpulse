/** biome-ignore-all lint/suspicious/noConsole: <test> */
import { readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const clientRoot = process.cwd();
const srcRoot = join(clientRoot, "src");

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

const testFiles = collectTestFiles(srcRoot).sort();

if (testFiles.length === 0) {
	console.log("No test files found.");
	process.exit(0);
}

let hasFailures = false;

for (const testFile of testFiles) {
	const displayPath = relative(clientRoot, testFile);
	console.log(`\nRunning ${displayPath}`);

	const proc = Bun.spawn(["bun", "test", testFile], {
		cwd: clientRoot,
		stdio: ["inherit", "inherit", "inherit"],
	});

	const exitCode = await proc.exited;
	if (exitCode !== 0) {
		hasFailures = true;
	}
}

process.exit(hasFailures ? 1 : 0);
