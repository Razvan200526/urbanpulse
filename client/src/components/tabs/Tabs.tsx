import { Dropdown } from "@client/components/Dropdown";
import {
	cn,
	type TabsProps as HeroTabsProps,
	Tabs as HeroUITabs,
} from "@heroui/react";
import { ChevronDownIcon } from "lucide-react";

export type TabItemType = {
	label: string;
	key: string;
	className?: string;
	hoverClassName?: string;
};

export type PannelItemType = {
	key: string;
	children: React.ReactNode;
};

export type TabsProps = Omit<HeroTabsProps, "children"> & {
	size?: "sm" | "md" | "lg";
	radius?: "sm" | "md" | "lg" | "full";
	items: TabItemType[];
	pannelItems?: PannelItemType[];
};

type SelectionKey = Parameters<
	NonNullable<HeroTabsProps["onSelectionChange"]>
>[0];

export const Tabs = ({
	pannelItems,
	items,
	className,
	onSelectionChange,
	selectedKey,
	defaultSelectedKey,
	...props
}: TabsProps) => {
	const currentSelectedKey =
		typeof selectedKey === "string"
			? selectedKey
			: typeof defaultSelectedKey === "string"
				? defaultSelectedKey
				: items[0]?.key;

	const selectedItem =
		items.find((item) => item.key === currentSelectedKey) ?? items[0] ?? null;

	const handleSelectionChange = (key: SelectionKey) => {
		onSelectionChange?.(key);
	};

	return (
		<>
			<div className={cn("md:hidden", className)}>
				<Dropdown
					placement="bottom start"
					className="w-(--trigger-width) min-w-0"
					trigger={
						<button
							type="button"
							className="flex w-full items-center justify-between gap-3 rounded-2xl border border-border bg-surface-secondary/70 px-4 py-3 text-left shadow-sm transition-colors duration-150 hover:bg-surface-secondary"
						>
							<div className="min-w-0">
								<p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted">
									View
								</p>
								<p className="truncate text-sm font-medium text-foreground">
									{selectedItem?.label ?? "Select"}
								</p>
							</div>
							<ChevronDownIcon className="size-4 shrink-0 text-accent" />
						</button>
					}
					items={items.map((item) => ({
						key: item.key,
						label: item.label,
						className: cn(
							"rounded-xl px-3 py-2 transition-colors duration-150",
							item.key === selectedItem?.key
								? "bg-accent/10"
								: "bg-transparent",
							item.className,
						),
						labelClassName: cn(
							item.key === selectedItem?.key
								? "text-accent font-semibold"
								: "text-foreground",
							item.hoverClassName,
						),
						onAction: () => handleSelectionChange(item.key),
					}))}
				/>
			</div>

			<HeroUITabs
				variant="primary"
				className={cn("hidden w-full max-w-md text-center md:block", className)}
				onSelectionChange={onSelectionChange}
				selectedKey={currentSelectedKey}
				defaultSelectedKey={defaultSelectedKey}
				{...props}
			>
				<HeroUITabs.ListContainer>
					<HeroUITabs.List
						aria-label="Options"
						className="bg-transparent rounded *:data-[selected=true]:text-accent-foreground *:data-[hovered=true]:bg-accent-soft-hover w-fit *:h-8 *:w-fit *:px-3 *:text-sm *:font-normal gap-2"
					>
						{items.map((item) => (
							<HeroUITabs.Tab
								key={item.key}
								id={item.key}
								className={cn("rounded", item.className)}
							>
								{item.label}
								<HeroUITabs.Indicator className="rounded bg-accent" />
							</HeroUITabs.Tab>
						))}
					</HeroUITabs.List>
				</HeroUITabs.ListContainer>
				{pannelItems?.map((item) => (
					<HeroUITabs.Panel key={item.key} id={item.key}>
						{item.children}
					</HeroUITabs.Panel>
				))}
			</HeroUITabs>
		</>
	);
};
