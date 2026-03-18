import { DevMailer } from "./DevMailer";
import { PrimaryMailer } from "./PrimaryMailer";

export const getMailer = () => {
	if (Bun.env.NODE_ENV === "production") {
		return new PrimaryMailer();
	} else {
		return new DevMailer();
	}
};
