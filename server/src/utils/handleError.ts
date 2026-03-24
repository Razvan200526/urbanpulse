import { logger } from "./Logger";

export const handleError = (e: unknown) => {
	if (e instanceof Error) {
		logger.exception(e);
	} else {
		logger.error(`An error occured ${e}`);
		console.error(e);
	}
};
