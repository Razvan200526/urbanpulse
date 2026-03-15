import { cn } from "@heroui/react";
import type { ComponentProps } from "react";

export const H6 = ({
	children,
	className,
	...props
}: {
	className?: string;
	children: React.ReactNode;
} & ComponentProps<"h6">) => {
	return (
		<h6
			className={cn(
				"text-sm/5 font-bold tracking-wide text-primary",
				className,
			)}
			{...props}
		>
			{children}
		</h6>
	);
};
