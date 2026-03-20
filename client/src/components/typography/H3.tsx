import { cn } from "@heroui/react";
import type { ComponentProps } from "react";

export const H3 = ({
	children,
	className,
	...props
}: {
	className?: string;
	children: React.ReactNode;
} & ComponentProps<"h3">) => {
	return (
		<h3
			className={cn("text-xl/8 font-bold tracking-wide text-accent", className)}
			{...props}
		>
			{children}
		</h3>
	);
};
