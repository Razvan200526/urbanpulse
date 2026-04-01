import type { DropdownItemDataType } from "@client/components/Dropdown";
import { Check } from "lucide-react";
import type { AlertsFilterMode } from "./store";

type BuildAlertFilterDropdownItemsArgs = {
	filter: AlertsFilterMode;
	totalCount: number;
	actionableCount: number;
	updatesCount: number;
	onSelect: (filter: AlertsFilterMode) => void;
};

const FILTER_ITEM_CLASSNAME =
	"data-[hovered=true]:bg-accent/10 data-[hovered=true]:text-accent";

export const alertFilterLabels: Record<AlertsFilterMode, string> = {
	all: "All alerts",
	actionable: "Action needed",
	updates: "Updates",
};

export const buildAlertFilterDropdownItems = ({
	filter,
	totalCount,
	actionableCount,
	updatesCount,
	onSelect,
}: BuildAlertFilterDropdownItemsArgs): DropdownItemDataType[] => {
	const counts: Record<AlertsFilterMode, number> = {
		all: totalCount,
		actionable: actionableCount,
		updates: updatesCount,
	};

	return (Object.keys(alertFilterLabels) as AlertsFilterMode[]).map((key) => ({
		key,
		label: alertFilterLabels[key],
		description: `${counts[key]} notification${counts[key] === 1 ? "" : "s"}`,
		className: FILTER_ITEM_CLASSNAME,
		endContent:
			filter === key ? <Check className="size-4 text-accent" /> : undefined,
		onAction: () => onSelect(key),
	}));
};
