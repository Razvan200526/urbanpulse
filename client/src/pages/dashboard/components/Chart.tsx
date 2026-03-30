import {
	CartesianGrid,
	Line,
	LineChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";

type ChartPoint = {
	date: string;
	label: string;
	pulses: number;
	alerts: number;
};

export const Chart = ({ data }: { data: ChartPoint[] }) => {
	if (data.length === 0) {
		return <p className="text-sm text-muted">No activity data yet.</p>;
	}

	return (
		<ResponsiveContainer width="100%" height="100%">
			<LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
				<CartesianGrid
					stroke="var(--color-border)"
					strokeDasharray="3 3"
					vertical={false}
				/>
				<XAxis
					dataKey="label"
					stroke="var(--muted)"
					fontSize={12}
					tickLine={false}
					axisLine={false}
					className="text-muted"
				/>
				<YAxis
					allowDecimals={false}
					stroke="var(--muted)"
					fontSize={12}
					tickLine={false}
					axisLine={false}
					className="text-muted"
				/>
				<Tooltip
					labelFormatter={(_, payload) => {
						const point = payload?.[0]?.payload as ChartPoint | undefined;
						if (!point) return "";
						return new Date(point.date).toLocaleDateString("en-US", {
							month: "short",
							day: "numeric",
						});
					}}
					contentStyle={{
						backgroundColor: "var(--color-surface)",
						borderColor: "var(--color-border)",
						borderRadius: "8px",
						color: "var(--color-accent)",
					}}
					itemStyle={{ color: "var(--color-accent)" }}
				/>
				<Line
					type="monotone"
					dataKey="pulses"
					name="Pulses"
					stroke="var(--color-accent)"
					strokeWidth={2}
					dot={false}
					activeDot={{ r: 4 }}
				/>
				<Line
					type="monotone"
					dataKey="alerts"
					name="Alerts"
					stroke="var(--color-secondary)"
					strokeWidth={2}
					dot={false}
					activeDot={{ r: 4 }}
				/>
			</LineChart>
		</ResponsiveContainer>
	);
};
