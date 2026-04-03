import { cn, Drawer, Tooltip } from "@heroui/react";
import { Button } from "../Button/Button";
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
					"flex h-dvh min-h-dvh shrink-0 flex-col items-center gap-4 border-r border-border bg-surface p-2",
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

				<div className="flex h-full min-h-0 w-full flex-col items-center gap-8">
					<SidebarMinimize onOpen={open} />
				</div>
			</div>
			<Drawer>
				<Drawer.Backdrop
					isOpen={isOpen}
					variant="opaque"
					onOpenChange={onOpenChange}
				>
					<Drawer.Content className="w-72 max-w-[85vw]" placement="left">
						<Drawer.Dialog className="flex h-dvh flex-col gap-8 rounded-none border-r border-border bg-surface p-2">
							<Sidebar />
						</Drawer.Dialog>
					</Drawer.Content>
				</Drawer.Backdrop>
			</Drawer>
		</>
	);
};
