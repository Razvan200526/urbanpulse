import { Card, cn } from "@heroui/react";

export const SectionCard = ({
	title,
	description,
	action,
	children,
	className,
	contentClassName,
}: {
	title: string;
	description?: string;
	action?: React.ReactNode;
	children: React.ReactNode;
	className?: string;
	contentClassName?: string;
}) => (
	<Card
		className={cn("border border-accent/20 bg-surface shadow-none", className)}
	>
		<Card.Header className="flex flex-col gap-3 border-b border-accent/15 p-4 sm:flex-row sm:items-start sm:justify-between sm:p-5">
			<div className="min-w-0">
				<Card.Title className="text-accent">{title}</Card.Title>
				{description ? (
					<Card.Description className="mt-1 text-sm">
						{description}
					</Card.Description>
				) : null}
			</div>
			{action ? <div className="w-full sm:w-auto">{action}</div> : null}
		</Card.Header>
		<Card.Content className={cn("p-4 sm:p-5", contentClassName)}>
			{children}
		</Card.Content>
	</Card>
);
