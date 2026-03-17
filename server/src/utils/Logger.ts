import { mainSymbols as f } from "figures";
import * as p from "picocolors";
import { pe } from "./PrettyError";
export class Logger {
	public info(message: string) {
		console.log(p.blue(`${f.info}: ${message}`));
	}

	public error(message: string) {
		console.log(p.red(`${f.cross}: ${message}`));
	}

	public exception(e: Error) {
		pe.render(e);
	}

	public success(message: string) {
		console.log(p.green(`${f.tick}: ${message}`));
	}
}

export const logger = new Logger();
