import { cn } from "@heroui/react";
import type { ComponentProps } from "react";

export const P = ({
	children,
	className,
	...props
}: {
	className?: string;
	children: React.ReactNode;
} & ComponentProps<"p">) => {
	return (
		<p
			className={cn("text-base text-gray-600 dark:text-gray-400", className)}
			{...props}
		>
			{children}
		</p>
	);
};
