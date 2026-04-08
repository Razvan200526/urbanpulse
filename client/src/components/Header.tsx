import { useIsMobile } from "@client/hooks/useMediaQuery";
import { cn } from "@heroui/react";
import { Button } from "./Button/Button";
import { MenuIcon } from "./icons/MenuIcon";
import { useAppSidebarStore } from "./sidebar/sidebarStore";
import { H3 } from "./typography";

export type HeaderProps = {
	title: string;
	tabs?: React.ReactNode;
	dropdown?: React.ReactNode;
	children?: React.ReactNode;
	layout?: "default" | "inline-mobile";
};

/**
 *
 * @param title
 * @param tabs Use the Heroui Tabs component here to render them directly into the header,will be useful for filtering and showing data quickly without user hassle
 * @param dropdown Will be used to create delete update resources directly from the page,with a button trigger
 * @returns A header component with a title, tabs, and dropdown.It will be the same all over for consistent styling.
 */
export const Header = ({
	title,
	tabs,
	dropdown,
	children,
	layout = "default",
}: HeaderProps) => {
	const isInlineMobile = layout === "inline-mobile";
	const isMobile = useIsMobile();
	const { isOpen, open } = useAppSidebarStore();
	const showMobileSidebarTrigger = isMobile && !isOpen;
	const isSimpleMobileHeader =
		isMobile && !tabs && !dropdown && !children && !isInlineMobile;

	return (
		<div className="sticky top-0 left-0 right-0 z-40 border-b border-border bg-surface px-4 py-3 sm:px-6 lg:px-8">
			{isSimpleMobileHeader ? (
				<div className="grid grid-cols-[2.75rem_minmax(0,1fr)_2.75rem] items-center gap-3 md:hidden">
					<div className="flex justify-start">
						{showMobileSidebarTrigger ? (
							<Button
								className="border border-accent bg-surface text-accent shadow-none"
								variant="ghost"
								isIconOnly
								radius="full"
								size="md"
								onPress={open}
								startContent={<MenuIcon className="size-5" />}
							/>
						) : null}
					</div>
					<H3 className="truncate text-center">{title}</H3>
					<div aria-hidden className="h-11 w-11" />
				</div>
			) : null}

			<div
				className={cn(
					"gap-3",
					isSimpleMobileHeader
						? "hidden md:flex md:flex-col lg:flex-row lg:items-center lg:justify-between"
						: isInlineMobile
							? "flex items-center justify-between"
							: "flex flex-col lg:flex-row lg:items-center lg:justify-between",
				)}
			>
				<div
					className={cn(
						"min-w-0",
						isInlineMobile
							? "flex items-center gap-3"
							: "flex min-w-0 flex-col gap-3 md:flex-row md:items-center md:gap-4",
					)}
				>
					<div className="flex min-w-0 items-center gap-3">
						{showMobileSidebarTrigger ? (
							<Button
								className="border border-accent bg-surface text-accent shadow-none md:hidden"
								variant="ghost"
								isIconOnly
								radius="full"
								size="md"
								onPress={open}
								startContent={<MenuIcon className="size-5" />}
							/>
						) : null}
						<H3 className="truncate">{title}</H3>
					</div>
					{tabs && (
						<div
							className={cn(isInlineMobile ? "shrink-0" : "w-full md:w-auto")}
						>
							{tabs}
						</div>
					)}
				</div>
				<div
					className={cn(
						"flex flex-wrap items-stretch gap-2",
						isInlineMobile
							? "shrink-0 justify-end"
							: "justify-start md:justify-end",
					)}
				>
					{children}
					{dropdown}
				</div>
			</div>
		</div>
	);
};
