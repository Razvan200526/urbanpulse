import { cacheManager } from "@server/services/cache/CacheManager";
import { notificationService } from "@server/services/NotificationService";
import { pulseService } from "@server/services/PulseService";
import type {
	DashboardOverviewData,
	TimeSeriesPoint,
} from "@server/services/types";
import { userService } from "@server/services/UserService";
import { handleError } from "@server/utils/handleError";
import { PulseEnum } from "@shared/types";

/**
 * Service responsible for preparing dashboard overview metrics and chart data.
 */
export class DashboardService {
	private cache = cacheManager;
	/**
	 * Adds a number of days to a date.
	 * @param {Date} date - Base date.
	 * @param {number} days - Number of days to add.
	 * @returns {Date} Shifted date.
	 */
	private addDays(date: Date, days: number): Date {
		const DAY_MS = 24 * 60 * 60 * 1000;
		return new Date(date.getTime() + days * DAY_MS);
	}

	/**
	 * Checks whether a date falls within an inclusive-start/exclusive-end interval.
	 * @param {Date} value - Date to check.
	 * @param {Date} start - Interval start.
	 * @param {Date} end - Interval end.
	 * @returns {boolean} True when value is in [start, end).
	 */
	private isWithinWindow(value: Date, start: Date, end: Date): boolean {
		const timestamp = value.getTime();
		return timestamp >= start.getTime() && timestamp < end.getTime();
	}

	/**
	 * Counts items whose createdAt value is inside a given time window.
	 * @param {{ createdAt: Date }[]} items - Collection to count from.
	 * @param {Date} start - Window start.
	 * @param {Date} end - Window end.
	 * @returns {number} Number of matching items.
	 */
	private countByWindow(
		items: { createdAt: Date }[],
		start: Date,
		end: Date,
	): number {
		return items.filter((item) =>
			this.isWithinWindow(item.createdAt, start, end),
		).length;
	}

	/**
	 * Builds the 7-day chart with pulse and alert counts per day.
	 * @param {{ createdAt: Date }[]} pulses - Pulses in the current 7-day window.
	 * @param {{ createdAt: Date }[]} notifications - Notifications in the current 7-day window.
	 * @param {Date} currentWindowStart - Start of the first chart day.
	 * @returns {TimeSeriesPoint[]} Chart points ordered oldest to newest.
	 */
	private buildTimeSeries(
		pulses: { createdAt: Date }[],
		notifications: { createdAt: Date }[],
		currentWindowStart: Date,
	): TimeSeriesPoint[] {
		const WINDOW_DAYS = 7;

		return Array.from({ length: WINDOW_DAYS }, (_, index) => {
			const dayStart = this.addDays(currentWindowStart, index);
			const dayEnd = this.addDays(dayStart, 1);

			return {
				date: dayStart.toISOString(),
				label: dayStart.toLocaleDateString("en-US", { weekday: "short" }),
				pulses: this.countByWindow(pulses, dayStart, dayEnd),
				alerts: this.countByWindow(notifications, dayStart, dayEnd),
			};
		});
	}

	/**
	 * Produces dashboard overview data for counts, delta changes, and chart.
	 * @param {Date} [referenceDate] - Optional date used to anchor rolling windows.
	 * @returns {Promise<DashboardOverviewData | null>} Overview payload or null on failure.
	 */
	async getOverview(
		referenceDate: Date = new Date(),
	): Promise<DashboardOverviewData | null> {
		// Cache the overview with date-based key (daily refresh)
		const dateKey = referenceDate.toISOString().split("T")[0];
		return await this.cache.getOrSet(
			`overview:${dateKey}`,
			async () => {
				try {
					const [pulseCounts, emergencyPulseCounts, userCounts, alertCounts] =
						await Promise.all([
							pulseService.getPulseCountsForLast7Days({}, referenceDate),
							pulseService.getPulseCountsForLast7Days(
								{ type: PulseEnum.Emergency },
								referenceDate,
							),
							userService.getUserCountsForLast7Days({}, referenceDate),
							notificationService.getAlertCountsForLast7Days({}, referenceDate),
						]);

					if (
						!pulseCounts ||
						!emergencyPulseCounts ||
						!userCounts ||
						!alertCounts
					) {
						return null;
					}

					const [pulsesForChart, notificationsForChart] = await Promise.all([
						pulseService.getPulsesByCondition(
							{},
							{
								createdAtFrom: pulseCounts.currentWindowStart,
								createdAtTo: pulseCounts.currentWindowEnd,
							},
						),
						notificationService.getNotificationsByCondition(
							{},
							{
								createdAtFrom: alertCounts.currentWindowStart,
								createdAtTo: alertCounts.currentWindowEnd,
							},
						),
					]);

					if (!pulsesForChart || !notificationsForChart) {
				return null;
			}

			const chart = this.buildTimeSeries(
				pulsesForChart,
				notificationsForChart,
				pulseCounts.currentWindowStart,
			);

			return {
				counts: {
					pulsesLast7Days: pulseCounts.pulsesLast7Days,
					emergencyPulsesLast7Days: emergencyPulseCounts.pulsesLast7Days,
					newUsersLast7Days: userCounts.newUsersLast7Days,
					alertsLast7Days: alertCounts.alertsLast7Days,
				},
				changes: {
					pulsesLast7Days:
						pulseCounts.pulsesLast7Days - pulseCounts.previousPulsesLast7Days,
					emergencyPulsesLast7Days:
						emergencyPulseCounts.pulsesLast7Days -
						emergencyPulseCounts.previousPulsesLast7Days,
					newUsersLast7Days:
						userCounts.newUsersLast7Days - userCounts.previousNewUsersLast7Days,
					alertsLast7Days:
						alertCounts.alertsLast7Days - alertCounts.previousAlertsLast7Days,
				},
				chart,
			};
				} catch (error) {
					handleError(error);
					return null;
				}
			},
			{ namespace: "dashboard", ttl: 300 }
		);
}
}

export const dashboardService = new DashboardService();
