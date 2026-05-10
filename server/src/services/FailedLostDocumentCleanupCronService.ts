import { logger } from "@server/utils/Logger";

const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
const DEFAULT_OLDER_THAN_HOURS = 24;
const DEFAULT_BATCH_LIMIT = 200;

class FailedLostDocumentCleanupCronService {
	private timer: ReturnType<typeof setInterval> | null = null;
	private inFlight = false;

	start(baseUrl: string, secret: string) {
		if (this.timer) {
			return;
		}

		const endpoint =
			`${baseUrl}/api/internal/lost-documents/cleanup-failed` +
			`?olderThanHours=${DEFAULT_OLDER_THAN_HOURS}&limit=${DEFAULT_BATCH_LIMIT}`;

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
						`Failed lost-document cleanup cron failed with status ${response.status}`,
					);
					return;
				}

				const body = (await response.json()) as {
					success?: boolean;
					message?: string;
					data?: {
						scannedCount?: number;
						deletedCount?: number;
						storageCleanupErrors?: number;
					};
				};

				if (!body.success) {
					logger.error(
						`Failed lost-document cleanup cron failed: ${body.message || "Unknown error"}`,
					);
					return;
				}

				logger.info(
					`Failed lost-document cleanup scanned ${body.data?.scannedCount ?? 0}, deleted ${body.data?.deletedCount ?? 0}, storage errors ${body.data?.storageCleanupErrors ?? 0}`,
				);
			} catch (error) {
				logger.exception(
					error instanceof Error
						? error
						: new Error("Failed lost-document cleanup cron request failed"),
				);
			} finally {
				this.inFlight = false;
			}
		}, CLEANUP_INTERVAL_MS);

		logger.info(
			`Failed lost-document cleanup cron started. Interval: ${CLEANUP_INTERVAL_MS}ms`,
		);
	}

	stop() {
		if (!this.timer) {
			return;
		}

		clearInterval(this.timer);
		this.timer = null;
		this.inFlight = false;
		logger.info("Failed lost-document cleanup cron stopped");
	}
}

export const failedLostDocumentCleanupCronService =
	new FailedLostDocumentCleanupCronService();
