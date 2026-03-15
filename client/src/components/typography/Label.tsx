import { cn } from "@heroui/react";

export type LabelProps = {
	id?: string;
	className?: string;
	children?: React.ReactNode;
};

export const Label = ({ id, className, children }: LabelProps) => {
	return (
		<label
			htmlFor={id}
			className={cn(
				"w-fit cursor-pointer block text-sm/6 font-semibold text-primary mb-2",
				className,
			)}
		>
			{children}
		</label>
	);
};
