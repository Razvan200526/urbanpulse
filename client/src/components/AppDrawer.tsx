import { useIsMobile } from "@client/hooks/useMediaQuery";
import { cn, Drawer } from "@heroui/react";

type DrawerPlacement = "top" | "right" | "bottom" | "left";

type AppDrawerProps = {
	children: React.ReactNode;
	isOpen?: boolean;
	onOpenChange?: (open: boolean) => void;
	trigger?: React.ReactNode;
	placement?: DrawerPlacement;
	mobilePlacement?: DrawerPlacement;
	backdrop?: "opaque" | "blur" | "transparent";
	header?: React.ReactNode;
	footer?: React.ReactNode;
	showHandle?: boolean;
	className?: string;
	contentClassName?: string;
	dialogClassName?: string;
	bodyClassName?: string;
	closeTriggerClassName?: string;
};

export const getDrawerSurfaceClassName = (placement: DrawerPlacement) => {
	switch (placement) {
		case "bottom":
			return "max-h-[88dvh] w-full rounded-t-sm border-x-0 border-b-0";
		case "top":
			return "w-full rounded-b-sm border-x-0 border-t-0";
		case "left":
			return "h-dvh rounded-r-sm border-y-0 border-l-0";
		default:
			return "h-dvh rounded-l-sm border-y-0 border-r-0";
	}
};

export const AppDrawer = ({
	children,
	isOpen,
	onOpenChange,
	trigger,
	placement = "right",
	mobilePlacement = "bottom",
	backdrop = "transparent",
	header,
	footer,
	showHandle,
	contentClassName,
	dialogClassName,
	bodyClassName,
}: AppDrawerProps) => {
	const isMobile = useIsMobile();
	const activePlacement = isMobile ? mobilePlacement : placement;
	const shouldShowHandle =
		showHandle ?? (activePlacement === "bottom" || activePlacement === "top");

	return (
		<Drawer>
			{trigger}
			<Drawer.Backdrop
				variant={backdrop}
				isOpen={isOpen}
				onOpenChange={onOpenChange}
			>
				<Drawer.Content
					placement={activePlacement}
					className={cn("overflow-hidden", contentClassName)}
				>
					<Drawer.Dialog
						className={cn(
							"relative flex overflow-hidden border border-border-secondary bg-surface",
							getDrawerSurfaceClassName(activePlacement),
							dialogClassName,
						)}
					>
						{shouldShowHandle && (
							<Drawer.Handle className="mt-3 self-center bg-border" />
						)}
						{header}
						<Drawer.Body
							className={cn("min-h-0 flex-1 overflow-y-auto", bodyClassName)}
						>
							{children}
						</Drawer.Body>
						{footer}
					</Drawer.Dialog>
				</Drawer.Content>
			</Drawer.Backdrop>
		</Drawer>
	);
};
