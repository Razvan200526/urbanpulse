import { cn, ScrollShadow } from "@heroui/react";
import { useSideBarItems } from "./hooks";
import { NavMenuItem } from "./NavMenuItem";

export const NavMenu = ({ isMinimize = false }) => {
	const { mainItems, secondaryItems } = useSideBarItems();

	return (
		<div className="flex flex-col flex-1 h-full overflow-hidden">
			<ScrollShadow isEnabled={true} className="flex-1 w-full" size={8}>
				<ul
					className={cn(
						"flex flex-col",
						isMinimize ? "items-center justify-center" : "px-1",
					)}
				>
					{mainItems.map((item) => (
						<li key={item.key} className="w-full flex">
							<NavMenuItem isMinimize={isMinimize} item={item} />
						</li>
					))}
				</ul>
			</ScrollShadow>
			<div
				className={cn(
					"flex flex-col gap-1 mt-auto shrink-0",
					isMinimize ? "w-full items-center justify-center" : "px-1",
				)}
			>
				{secondaryItems.map((item, index) => (
					// biome-ignore lint/suspicious/noArrayIndexKey: <the items don't chage>
					<NavMenuItem key={index} isMinimize={isMinimize} item={item} />
				))}
			</div>
		</div>
	);
};
