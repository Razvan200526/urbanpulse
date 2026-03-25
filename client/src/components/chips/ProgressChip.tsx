import { Chip, cn, ProgressCircle, type ChipProps } from "@heroui/react";
import { PulseUploadStateEnum } from "@shared/types";

export type ProgressChipProps = Omit<ChipProps, "children"> & {
	status: PulseUploadStateEnum;
};

export const ProgrssChipClassNames: Record<PulseUploadStateEnum, any> = {
	[PulseUploadStateEnum.Pending]: {
		className: "text-accent bg-accent/5 border-accent",
		icon: (
			<ProgressCircle isIndeterminate size="sm" className="size-3.5">
				<ProgressCircle.Track strokeWidth={2}>
					<ProgressCircle.TrackCircle cx={18} cy={18} r={17} strokeWidth={2} />
					<ProgressCircle.FillCircle cx={18} cy={18} r={17} strokeWidth={2} />
				</ProgressCircle.Track>
			</ProgressCircle>
		),
	},
	[PulseUploadStateEnum.Uploaded]: {
		className: "text-blue-400 bg-blue-900/20 border-blue-400",
	},
	[PulseUploadStateEnum.Completed]: {
		className: "text-green-400 bg-green-900/20 border-green-400",
	},
	[PulseUploadStateEnum.Failed]: {
		className: "text-red-400 bg-red-900/20 border-red-400",
	},
};

export const ProgressChip = ({ status, ...props }: ProgressChipProps) => {
	const config = ProgrssChipClassNames[status];
	return (
		<Chip className={cn("rounded-full border", config.className)} {...props}>
			{config.icon && config.icon}
			<Chip.Label>{status[0].toUpperCase() + status.slice(1)}</Chip.Label>
		</Chip>
	);
};
