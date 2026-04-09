import { type TabItemType, Tabs } from "@client/components/tabs/Tabs";
import { Label } from "@client/components/typography";
import { cn } from "@heroui/styles";

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
		<div className={cn("flex flex-col gap-2 items-start", className)}>
			<Label className="text-accent text-sm font-semibold">{label}</Label>
			<Tabs
				className="flex items-start text-start"
				items={items}
				selectedKey={selectedKey}
				onSelectionChange={(key) => onSelectionChange(String(key))}
			/>
		</div>
	);
};
