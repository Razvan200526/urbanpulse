import * as p from "picocolors";
import type { ZodError } from "zod";
import { pe } from "./PrettyError";

export const printZodError = (err: ZodError) => {
	const issues = err.issues;
	issues.forEach((issue) => {
		const output = `${p.yellow(String(issue.path[0]))} : ${p.redBright(issue.message.toString())}`;
		console.error(pe.render(output));
	});
};
