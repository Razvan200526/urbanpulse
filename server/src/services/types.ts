export type Last7DaysPulseCounts = {
	pulsesLast7Days: number;
	previousPulsesLast7Days: number;
	currentWindowStart: Date;
	currentWindowEnd: Date;
	previousWindowStart: Date;
	previousWindowEnd: Date;
};

export type Last7DaysUserCounts = {
	newUsersLast7Days: number;
	previousNewUsersLast7Days: number;
	currentWindowStart: Date;
	currentWindowEnd: Date;
	previousWindowStart: Date;
	previousWindowEnd: Date;
};

export type Last7DaysAlertCounts = {
	alertsLast7Days: number;
	previousAlertsLast7Days: number;
	currentWindowStart: Date;
	currentWindowEnd: Date;
	previousWindowStart: Date;
	previousWindowEnd: Date;
};

export type TimeSeriesPoint = {
	date: string;
	label: string;
	pulses: number;
	alerts: number;
};

export type DashboardOverviewData = {
	counts: {
		pulsesLast7Days: number;
		emergencyPulsesLast7Days: number;
		newUsersLast7Days: number;
		alertsLast7Days: number;
	};
	changes: {
		pulsesLast7Days: number;
		emergencyPulsesLast7Days: number;
		newUsersLast7Days: number;
		alertsLast7Days: number;
	};
	chart: TimeSeriesPoint[];
};
