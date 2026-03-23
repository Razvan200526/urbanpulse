import {
	cn,
	type TabsProps as HeroTabsProps,
	Tabs as HeroUITabs,
} from "@heroui/react";

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

export const Tabs = ({ pannelItems, items, ...props }: TabsProps) => {
	return (
		<HeroUITabs
			variant="primary"
			className="w-full max-w-md text-center"
			{...props}
		>
			<HeroUITabs.ListContainer className="">
				<HeroUITabs.List
					aria-label="Options"
					className="bg-transparent rounded *:data-[selected=true]:text-accent-foreground *:data-[hovered=true]:bg-accent-soft-hover w-fit *:h-8 *:w-fit *:px-3 *:text-sm *:font-normal"
				>
					{items.map((item) => (
						<HeroUITabs.Tab
							key={item.key}
							id={item.key}
							className={cn("rounded", item.className)} //find a way to implement the hover classname as well
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
	);
};
