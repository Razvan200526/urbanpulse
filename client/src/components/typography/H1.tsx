import { cn } from "@heroui/react";
import type { ComponentProps } from "react";

export const H1 = ({
	children,
	className,
	...props
}: {
	className?: string;
	children: React.ReactNode;
} & ComponentProps<"h1">) => {
	return (
		<h1
			className={cn(
				"text-3xl/10 font-bold tracking-wide text-primary",
				className,
			)}
			{...props}
		>
			{children}
		</h1>
	);
};
