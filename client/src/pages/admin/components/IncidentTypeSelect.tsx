import { Label } from "@client/components/typography";
import type { ClientIncidentType } from "@client/hooks/useIncidentTypes";
import { ListBox, ListBoxItem, Select } from "@heroui/react";

export const IncidentTypeSelect = ({
	label = "Incident type",
	value,
	options,
	onChange,
}: {
	label?: string;
	value: string;
	options: ClientIncidentType[];
	onChange: (nextId: string) => void;
}) => {
	return (
		<Select
			selectedKey={value || null}
			onSelectionChange={(key) => {
				if (typeof key === "string") {
					onChange(key);
				}
			}}
		>
			<Label className="text-accent">{label}</Label>
			<Select.Trigger className="text-accent border border-accent rounded">
				<Select.Value />
				<Select.Indicator />
			</Select.Trigger>
			<Select.Popover className="border border-accent">
				<ListBox className="rounded" items={options}>
					{(item) => (
						<ListBoxItem
							className="text-muted bg-surface hover:text-accent-hover"
							key={item.id}
							id={item.id}
							textValue={item.label}
						>
							{item.label}
						</ListBoxItem>
					)}
				</ListBox>
			</Select.Popover>
		</Select>
	);
};
