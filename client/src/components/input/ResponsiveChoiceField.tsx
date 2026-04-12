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
		<div
			className={cn(
				"flex w-full min-w-0 flex-col items-start gap-2",
				className,
			)}
		>
			<Label className="text-accent text-sm font-semibold">{label}</Label>
			<Tabs
				className="flex w-full items-start text-start"
				items={items}
				selectedKey={selectedKey}
				onSelectionChange={(key) => onSelectionChange(String(key))}
			/>
		</div>
	);
};
