import { cn, Drawer, Tooltip } from "@heroui/react";
import { MenuIcon } from "../icons/MenuIcon";
import { Sidebar } from "./Sidebar";
import { SidebarMinimize } from "./SidebarMinimize";
import { useAppSidebarStore } from "./sidebarStore";
import { Button } from "../Button/Button";
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
				<Tooltip delay={0} trigger={"focus"}>
					<Button
						variant="ghost"
						isIconOnly={true}
						onPress={open}
						size="md"
						className="text-accent"
						radius="full"
						startContent={<MenuIcon className="size-5" />}
					/>
					<Tooltip.Content className="rounded-full border border-accent">
						<p className="text-accent">Expand Sidebar</p>
					</Tooltip.Content>
				</Tooltip>

				<div className="flex flex-col items-center gap-8 h-full">
					<SidebarMinimize onOpen={open} />
				</div>
			</div>
			<Drawer>
				<Drawer.Backdrop
					isOpen={isOpen}
					variant="opaque"
					onOpenChange={onOpenChange}
				>
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
