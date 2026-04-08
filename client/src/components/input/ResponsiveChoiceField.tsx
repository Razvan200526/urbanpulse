import { type TabItemType, Tabs } from "@client/components/tabs/Tabs";
import { Label } from "@client/components/typography";

type ResponsiveChoiceFieldProps = {
	label: string;
	items: TabItemType[];
	selectedKey: string;
	onSelectionChange: (key: string) => void;
	className?: string;
};

export const ResponsiveChoiceField = ({
	label,
	items,
	selectedKey,
	onSelectionChange,
	className,
}: ResponsiveChoiceFieldProps) => {
	return (
		<div className={className ?? "flex flex-col gap-2"}>
			<Label className="text-accent text-sm font-semibold">{label}</Label>
			<Tabs
				items={items}
				selectedKey={selectedKey}
				onSelectionChange={(key) => onSelectionChange(String(key))}
			/>
		</div>
	);
};
