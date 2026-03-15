import { cn } from "@heroui/react";
import type { ComponentProps } from "react";

export const H4 = ({
	children,
	className,
	...props
}: {
	className?: string;
	children: React.ReactNode;
} & ComponentProps<"h4">) => {
	return (
		<h4
			className={cn(
				"text-lg/7 font-bold tracking-wide text-primary",
				className,
			)}
			{...props}
		>
			{children}
		</h4>
	);
};
