import { authMiddleware } from "@server/middleware/authMiddleware";
import { notificationRepository } from "@server/repositories/NotificationRepository";
import { pulseRepository } from "@server/repositories/PulseRepository";
import { userRepository } from "@server/repositories/UserRepository";
import { PulseEnum } from "@shared/types";
import { Hono } from "hono";

type TimeSeriesPoint = {
	date: string;
	label: string;
	pulses: number;
	alerts: number;
};

const DAY_MS = 24 * 60 * 60 * 1000;
const WINDOW_DAYS = 7;

function startOfUtcDay(date: Date) {
	return new Date(
		Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
	);
}

function addDays(date: Date, days: number) {
	return new Date(date.getTime() + days * DAY_MS);
}

function isWithinWindow(value: Date, start: Date, end: Date) {
	const timestamp = value.getTime();
	return timestamp >= start.getTime() && timestamp < end.getTime();
}

function countByWindow<T extends { createdAt: Date }>(
	items: T[],
	start: Date,
	end: Date,
) {
	return items.filter((item) => isWithinWindow(item.createdAt, start, end))
		.length;
}

function buildTimeSeries(
	pulses: Awaited<ReturnType<typeof pulseRepository.getAll>>,
	notifications: Awaited<ReturnType<typeof notificationRepository.getAll>>,
	todayStart: Date,
): TimeSeriesPoint[] {
	return Array.from({ length: WINDOW_DAYS }, (_, index) => {
		const dayStart = addDays(todayStart, index - (WINDOW_DAYS - 1));
		const dayEnd = addDays(dayStart, 1);

		return {
			date: dayStart.toISOString(),
			label: dayStart.toLocaleDateString("en-US", { weekday: "short" }),
			pulses: countByWindow(pulses, dayStart, dayEnd),
			alerts: countByWindow(notifications, dayStart, dayEnd),
		};
	});
}

export const dashboardController = new Hono()
	.basePath("/dashboard")
	.use(authMiddleware)
	.get("/overview", async (c) => {
		const session = c.get("session");
		if (!session) {
			return c.json(
				{ success: false, message: "Unauthorized", data: null },
				401,
			);
		}

		const [users, pulses, notifications] = await Promise.all([
			userRepository.getAll(),
			pulseRepository.getAll(),
			notificationRepository.getAll(),
		]);

		const todayStart = startOfUtcDay(new Date());
		const currentWindowStart = addDays(todayStart, -(WINDOW_DAYS - 1));
		const currentWindowEnd = addDays(todayStart, 1);
		const previousWindowStart = addDays(currentWindowStart, -WINDOW_DAYS);
		const previousWindowEnd = currentWindowStart;

		const emergencyPulses = pulses.filter(
			(pulse) => pulse.type === PulseEnum.Emergency,
		);

		const pulsesLast7Days = countByWindow(
			pulses,
			currentWindowStart,
			currentWindowEnd,
		);
		const previousPulsesLast7Days = countByWindow(
			pulses,
			previousWindowStart,
			previousWindowEnd,
		);
		const emergencyPulsesLast7Days = countByWindow(
			emergencyPulses,
			currentWindowStart,
			currentWindowEnd,
		);
		const previousEmergencyPulsesLast7Days = countByWindow(
			emergencyPulses,
			previousWindowStart,
			previousWindowEnd,
		);
		const newUsersLast7Days = countByWindow(
			users,
			currentWindowStart,
			currentWindowEnd,
		);
		const previousNewUsersLast7Days = countByWindow(
			users,
			previousWindowStart,
			previousWindowEnd,
		);
		const alertsLast7Days = countByWindow(
			notifications,
			currentWindowStart,
			currentWindowEnd,
		);
		const previousAlertsLast7Days = countByWindow(
			notifications,
			previousWindowStart,
			previousWindowEnd,
		);

		return c.json({
			success: true,
			message: "Dashboard overview retrieved",
			data: {
				counts: {
					pulsesLast7Days,
					emergencyPulsesLast7Days,
					newUsersLast7Days,
					alertsLast7Days,
				},
				changes: {
					pulsesLast7Days: pulsesLast7Days - previousPulsesLast7Days,
					emergencyPulsesLast7Days:
						emergencyPulsesLast7Days - previousEmergencyPulsesLast7Days,
					newUsersLast7Days: newUsersLast7Days - previousNewUsersLast7Days,
					alertsLast7Days: alertsLast7Days - previousAlertsLast7Days,
				},
				chart: buildTimeSeries(pulses, notifications, todayStart),
			},
		});
	});
