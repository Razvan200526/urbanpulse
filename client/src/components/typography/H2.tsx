import { cn } from "@heroui/react";
import type { ComponentProps } from "react";

export const H2 = ({
	children,
	className,
	...props
}: {
	className?: string;
	children: React.ReactNode;
} & ComponentProps<"h2">) => {
	return (
		<h2
			className={cn(
				"text-2xl/9 font-bold tracking-wide text-primary",
				className,
			)}
			{...props}
		>
			{children}
		</h2>
	);
};
