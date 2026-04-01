import type { DropdownItemDataType } from "@client/components/Dropdown";

export type FilterDropdownType = "availability" | "resourceType";

const FILTER_ITEM_CLASSNAME =
	"data-[hovered=true]:bg-accent/20 data-[hovered=true]:text-accent";

const buildItems = (labels: string[]): DropdownItemDataType[] =>
	labels.map((label) => ({
		label,
		key: label,
		className: FILTER_ITEM_CLASSNAME,
	}));

const FILTER_ITEMS_BY_TYPE: Record<FilterDropdownType, DropdownItemDataType[]> =
	{
		availability: buildItems([
			"All",
			"Available",
			"Unavailable",
			"Currently Unavailable",
		]),
		resourceType: buildItems(["All", "Skill", "Item", "Space"]),
	};

export const FilterDropdownItems = (
	type: FilterDropdownType,
): DropdownItemDataType[] => {
	return FILTER_ITEMS_BY_TYPE[type];
};
