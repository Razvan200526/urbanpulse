import { Card } from "@heroui/react";

export const ProfileStatsCard = ({
	label,
	value,
	description,
}: {
	label: string;
	value: React.ReactNode;
	description: string;
}) => {
	return (
		<Card className="border border-border shadow-none">
			<Card.Content className="space-y-2 p-5">
				<p className="text-sm text-muted">{label}</p>
				<p className="text-3xl font-semibold text-foreground">{value}</p>
				<p className="text-sm text-muted">{description}</p>
			</Card.Content>
		</Card>
	);
};
