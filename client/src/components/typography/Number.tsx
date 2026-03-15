import { cn } from "@heroui/react";
import type { ReactNode } from "react";

export const NumberText = ({
	className,
	children,
}: {
	className?: string;
	children: ReactNode;
}) => {
	return <span className={cn("font-number", className)}>{children}</span>;
};
