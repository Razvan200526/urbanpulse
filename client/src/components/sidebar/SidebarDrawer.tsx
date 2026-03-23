import { Button, cn, Drawer, Tooltip } from "@heroui/react";
import { MenuIcon } from "../icons/MenuIcon";
import { Sidebar } from "./Sidebar";
import { SidebarMinimize } from "./SidebarMinimize";
import { useAppSidebarStore } from "./sidebarStore";

export const SidebarDrawer = () => {
	const { isOpen, open, onOpenChange } = useAppSidebarStore();

	return (
		<>
			<div
				className={cn(
					"flex-col items-center gap-4 border-r border-border p-2 bg-surface shrink-0",
					!isOpen ? "flex" : "flex 2xl:hidden",
				)}
			>
				<Tooltip delay={0}>
					<Button
						variant="ghost"
						isIconOnly={true}
						onPress={open}
						size="md"
						className="rounded-full text-accent"
					>
						<MenuIcon className="size-5" />
						<Tooltip.Content className="rounded-full">
							<p className="text-accent">Expand Sidebar</p>
						</Tooltip.Content>
					</Button>
				</Tooltip>

				<div className="flex flex-col items-center gap-8 h-full">
					<SidebarMinimize onOpen={open} />
				</div>
			</div>
			<Drawer isOpen={isOpen} onOpenChange={onOpenChange}>
				<Drawer.Backdrop variant="transparent">
					<Drawer.Content className="w-72" placement="left">
						<Drawer.Dialog className="bg-surface rounded-none h-full flex flex-col gap-8 p-2 border-r border-border">
							<Sidebar />
						</Drawer.Dialog>
					</Drawer.Content>
				</Drawer.Backdrop>
			</Drawer>
		</>
	);
};
