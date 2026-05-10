import { logger } from "@server/utils/Logger";

const REMATCH_INTERVAL_MS = 60_000;

class DocumentRematchCronService {
	private timer: ReturnType<typeof setInterval> | null = null;
	private inFlight = false;

	start(baseUrl: string, secret: string) {
		if (this.timer) {
			return;
		}

		const endpoint = `${baseUrl}/api/internal/lost-documents/rematch-all?renotifyExisting=false`;

		this.timer = setInterval(async () => {
			if (this.inFlight) {
				return;
			}

			this.inFlight = true;
			try {
				const response = await fetch(endpoint, {
					method: "POST",
					headers: {
						"x-lost-document-secret": secret,
					},
				});

				if (!response.ok) {
					logger.error(
						`Document rematch cron failed with status ${response.status}`,
					);
					return;
				}

				const body = (await response.json()) as {
					success?: boolean;
					message?: string;
					data?: {
						processedDocuments?: number;
						rematchedCount?: number;
					};
				};

				if (!body.success) {
					logger.error(
						`Document rematch cron failed: ${body.message || "Unknown error"}`,
					);
					return;
				}

				logger.info(
					`Document rematch cron processed ${body.data?.processedDocuments ?? 0} documents and rematch ${body.data?.rematchedCount ?? 0} documents`,
				);
			} catch (error) {
				logger.exception(
					error instanceof Error
						? error
						: new Error("Document rematch cron request failed"),
				);
			} finally {
				this.inFlight = false;
			}
		}, REMATCH_INTERVAL_MS);

		logger.info(
			`Document rematch cron started. Interval: ${REMATCH_INTERVAL_MS}ms`,
		);
	}

	stop() {
		if (!this.timer) {
			return;
		}

		clearInterval(this.timer);
		this.timer = null;
		this.inFlight = false;
		logger.info("Document rematch cron stopped");
	}
}

export const documentRematchCronService = new DocumentRematchCronService();
