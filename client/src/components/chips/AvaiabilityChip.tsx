import { Chip, type ChipProps, cn } from "@heroui/react";
import type { ResourceAvailabilityType } from "@shared/types";

export type AvailabilityChipProps = Omit<ChipProps, "children"> & {
	status: ResourceAvailabilityType;
};

export const AvailabilityChipClassnames: Record<
	ResourceAvailabilityType,
	ChipProps["color"]
> = {
	Available: "success",
	Unavailable: "danger",
	"Currently Unavailable": "warning",
};
export const AvailabilityChip = ({
	status,
	...props
}: AvailabilityChipProps) => {
	const color = AvailabilityChipClassnames[status];
	return (
		<Chip
			className={cn("rounded-full", `border border-${color}`)}
			color={color}
			variant="soft"
			{...props}
		>
			<Chip.Label>{status}</Chip.Label>
		</Chip>
	);
};
