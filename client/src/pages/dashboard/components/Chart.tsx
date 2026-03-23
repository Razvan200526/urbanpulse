import { Card } from "@heroui/react";
import { Activity } from "lucide-react";
import {
	Line,
	LineChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";

const data = [
	{ month: "Jan", activeUsers: 4000, newReports: 2400 },
	{ month: "Feb", activeUsers: 3000, newReports: 1398 },
	{ month: "Mar", activeUsers: 2000, newReports: 9800 },
	{ month: "Apr", activeUsers: 2780, newReports: 3908 },
	{ month: "May", activeUsers: 1890, newReports: 4800 },
	{ month: "Jun", activeUsers: 2390, newReports: 3800 },
	{ month: "Jul", activeUsers: 3490, newReports: 4300 },
];

export const Chart = () => {
	return (
		<Card className="lg:col-span-2 shadow-none border border-border bg-surface w-full h-full">
			<Card.Header className="flex flex-col items-start justify-center pb-4">
				<Card.Title className="flex items-center gap-2">
					<Activity className="size-5 text-accent" />
					City Activity Overview
				</Card.Title>
				<Card.Description className="text-muted">
					Monitoring real-time urban dynamics over the last 7 months
				</Card.Description>
			</Card.Header>
			<Card.Content className="h-75 w-full pt-6 border-t border-border">
				<ResponsiveContainer width="100%" height="100%">
					<LineChart
						data={data}
						margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
					>
						<XAxis
							dataKey="month"
							stroke="var(--muted)"
							fontSize={12}
							tickLine={false}
							axisLine={false}
							className="text-muted"
						/>
						<YAxis
							stroke="var(--muted)"
							fontSize={12}
							tickLine={false}
							axisLine={false}
							className="text-muted"
							tickFormatter={(value) => `${value}`}
						/>
						<Tooltip
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
							dataKey="activeUsers"
							stroke="var(--color-accent)"
							strokeWidth={2}
							dot={false}
							activeDot={{ r: 4 }}
						/>
						<Line
							type="monotone"
							dataKey="newReports"
							stroke="var(--color-secondary)"
							strokeWidth={2}
							dot={false}
							activeDot={{ r: 4 }}
						/>
					</LineChart>
				</ResponsiveContainer>
			</Card.Content>
		</Card>
	);
};
