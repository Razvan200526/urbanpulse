import { cn } from "@heroui/react";
import { UrgencyEnum } from "@shared/types";
import { useId } from "react";

const URGENCY_CONFIG: Record<
	UrgencyEnum,
	{
		label: string;
		barColor: string;
		textColor: string;
		bars: number;
		animate: boolean;
	}
> = {
	[UrgencyEnum.Immediate]: {
		label: "Immediate",
		barColor: "bg-[var(--danger)]",
		textColor: "text-[var(--danger)]",
		bars: 4,
		animate: true,
	},
	[UrgencyEnum.Urgent]: {
		label: "Urgent",
		barColor: "bg-[var(--warning)]",
		textColor: "text-[var(--warning)]",
		bars: 3,
		animate: false,
	},
	[UrgencyEnum.NotUrgent]: {
		label: "Not Urgent",
		barColor: "bg-[var(--success)]",
		textColor: "text-[var(--success)]",
		bars: 1,
		animate: false,
	},
	[UrgencyEnum.Unknown]: {
		label: "Unknown",
		barColor: "bg-[var(--muted)]",
		textColor: "text-[var(--muted)]",
		bars: 0,
		animate: false,
	},
};
export const UrgencyMeter = ({ urgency }: { urgency: UrgencyEnum }) => {
	const cfg = URGENCY_CONFIG[urgency];
	const id = useId();

	if (urgency === UrgencyEnum.Unknown) {
		return <span className="text-sm text-muted italic">Unknown</span>;
	}
	return (
		<div className="flex items-center gap-2.5">
			<div className="flex items-end gap-0.75 h-5">
				{Array.from({ length: 4 }).map((_, i) => (
					<div
						key={id}
						className={cn(
							"w-1.25 rounded-full",
							i < cfg.bars
								? cn(cfg.barColor, cfg.animate && "animate-pulse")
								: "bg-border",
						)}
						style={{ height: `${(i + 1) * 5}px` }}
					/>
				))}
			</div>
			<span className={cn("text-sm font-semibold", cfg.textColor)}>
				{cfg.label}
			</span>
		</div>
	);
};
