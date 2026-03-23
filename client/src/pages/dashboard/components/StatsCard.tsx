import { Card } from "@heroui/react";
import type { StatType } from "./fakeStats";

export const StatsCard = ({ stat }: { stat: StatType }) => {
	return (
		<Card
			key={stat.title}
			className="p-4 shadow-none border border-border-secondary"
		>
			<Card.Header className="flex flex-row items-center justify-between pb-2 space-y-0">
				<Card.Title className="text-sm font-semibold text-accent">
					{stat.title}
				</Card.Title>
				{stat.icon}
			</Card.Header>
			<Card.Content>
				<div className="text-xl font-bold text-foreground">{stat.value}</div>
				<p className="text-xs text-foreground/50 mt-1 flex items-center justify-start gap-2">
					<span
						className={
							stat.trend.startsWith("+") ? "text-success" : "text-danger"
						}
					>
						{stat.trend}
					</span>
					from last month
				</p>
			</Card.Content>
		</Card>
	);
};
