import { logger } from "@server/utils/Logger";
import type { Mailer, SendMailParams } from "./Mailer";
import { Resend } from "resend";
import { handleError } from "@server/utils/handleError";
export class PrimaryMailer implements Mailer {
	private resend: Resend;

  constructor() {
    this.resend = new Resend(Bun.env.RESEND_API_KEY);
  }

  async send({ to, subject, html }: SendMailParams) {
    try {
      const {data , error} = await this.resend.emails.send({
        from: "Urban Pulse",
        to,
        subject,
        html,
      })
      if (error) {
        if(error instanceof Error) {
          logger.exception(error);
        }
      } else {
        logger.info(`Mail sent successfully: ${JSON.stringify(data)}`);
      }
    } catch (error) {
      handleError(error)
    }
	}
}
