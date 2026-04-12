import {
	cn,
	Button as HeroButton,
	type ButtonProps as HeroButtonProps,
	Spinner,
} from "@heroui/react";

export type ButtonProps = Omit<
	HeroButtonProps,
	"radius" | "startContent" | "endContent"
> & {
	/**
	 * Controls the border-radius of the button
	 * @default "md"
	 */
	radius?: "sm" | "md" | "lg" | "full";
	/**
	 * Content to render before the button label (typically an icon)
	 */
	startContent?: React.ReactNode;
	/**
	 * Content to render after the button label (typically an icon)
	 */
	endContent?: React.ReactNode;
};

const radiusMap = {
	sm: "rounded-sm",
	md: "rounded",
	lg: "rounded-lg",
	full: "rounded-full",
} as const;

export const Button = ({
	radius = "md",
	startContent,
	endContent,
	className,
	children,
	...props
}: ButtonProps) => {
	const renderChildren = (renderProps: any) => {
		const content =
			typeof children === "function" ? children(renderProps) : children;

		return (
			<>
				{!props.isPending && startContent && (
					<span className="flex shrink-0 items-center justify-center">
						{startContent}
					</span>
				)}
				{props.isPending && <Spinner className="text-white" />}
				{content}
				{endContent && (
					<span className="flex shrink-0 items-center justify-center">
						{endContent}
					</span>
				)}
			</>
		);
	};

	return (
		<HeroButton
			className={cn(
				radiusMap[radius],
				"flex items-center justify-center gap-2",
				className,
				props.variant === "outline"
					? "text-accent border border-accent hover:bg-accent-soft-hover"
					: "",
			)}
			{...props}
		>
			{renderChildren}
		</HeroButton>
	);
};
