import { Button, Tooltip } from "@heroui/react";
import { Logo } from "../icons/Logo";
import { H4 } from "../typography";
import { ChevronRightIcon } from "../icons/ChevronRight";
import { ChevronLeftIcon } from "lucide-react";
import { BellIcon } from "../icons/BellIcon";
import { MoonIcon } from "../icons/MoonIcon";
import { SunIcon } from "../icons/SunIcon";
import { useAppSidebarStore } from "./sidebarStore";
import { useThemeStore } from "./store";

export const Header = () => {
	const { close: closeSidebar, isOpen } = useAppSidebarStore();
	const { theme, toggleTheme } = useThemeStore();

	return (
		<div className="flex items-center justify-between pt-4 pr-2">
			<div className="flex items-center gap-2 px-2 w-full">
				<div className="flex w-full items-center text-center gap-3">
					<Logo className="size-8" />
					{isOpen && <H4 className="text-accent pt-1">UrbanPulse</H4>}
				</div>
			</div>
			<div className="flex items-center justify-end gap-1.5">
				<Tooltip delay={0}>
					<Button
						className="rounded-full"
						size="sm"
						variant="ghost"
						onPress={toggleTheme}
					>
						{theme === "dark" ? (
							<SunIcon className="size-4 text-accent" />
						) : (
							<MoonIcon className="size-4 text-accent" />
						)}
					</Button>
					<Tooltip.Content className="rounded-full">
						<p className="text-accent">Toggle theme</p>
					</Tooltip.Content>
				</Tooltip>

				{isOpen ? (
					<Tooltip delay={0}>
						<Button
							className="rounded-full"
							size="sm"
							variant="ghost"
							onPress={() => {
								closeSidebar();
							}}
						>
							<ChevronRightIcon className="size-3.5 rotate-180 text-accent" />
						</Button>
						<Tooltip.Content className="rounded-full">
							<p className="text-accent">Minimize sidebar</p>
						</Tooltip.Content>
					</Tooltip>
				) : (
					<Tooltip>
						<Tooltip.Content>Minimize sidebar</Tooltip.Content>
						<Button
							isIconOnly={true}
							className="rounded-full"
							variant="ghost"
							onPress={closeSidebar}
						>
							<ChevronLeftIcon className="size-4" />
						</Button>
					</Tooltip>
				)}

				<BellIcon />
			</div>
		</div>
	);
};
