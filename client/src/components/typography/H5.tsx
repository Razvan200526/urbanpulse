import { cn } from "@heroui/react";
import type { ComponentProps } from "react";

export const H5 = ({
	children,
	className,
	...props
}: {
	className?: string;
	children: React.ReactNode;
} & ComponentProps<"h5">) => {
	return (
		<h5
			className={cn(
				"text-base/6 font-bold tracking-wide text-primary",
				className,
			)}
			{...props}
		>
			{children}
		</h5>
	);
};
