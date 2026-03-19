import { logger } from "@server/utils/Logger";
import nodemailer from "nodemailer";
import type { Mailer, SendMailParams } from "./Mailer";

export class DevMailer implements Mailer {
	private transporter = nodemailer.createTransport("smtp://localhost:1025");

	async send({ to, subject, html }: SendMailParams): Promise<void> {
		logger.info("sending email");
		const from = `"UrbanPulse" <${Bun.env.MAIL_FROM || "no-reply@urbanpulse"}>`;
		const result = await this.transporter.sendMail({
			from,
			to,
			subject,
			html,
		});
		logger.info(
			`[DevMailer] : Result from sendMail - ${JSON.stringify(result)}`,
		);
	}
}
