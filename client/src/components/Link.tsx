import { cn, Link as HeroLink, type LinkProps } from "@heroui/react";
import {
	Link as RouterLink,
	type LinkProps as RouterLinkProps,
} from "react-router";

export const ExternalLink = (props: LinkProps) => {
	return <HeroLink {...props}>{props.children}</HeroLink>;
};

export const Link = (props: RouterLinkProps) => {
	return (
		<RouterLink
			{...props}
			className={cn(
				"decoration-none cursor-pointer tracking-wide text-primary underline-offset-4 outline-0 select-none disabled:cursor-not-allowed disabled:opacity-50",
				"relative before:absolute before:bottom-[-2px] before:left-0 before:block before:h-[2px] before:w-full before:content-['']",
				"before:bg-secondary-text before:scale-x-0 before:transition-transform before:duration-300 hover:before:scale-x-100",
				"font-medium",
				props.className,
			)}
		>
			{props.children}
		</RouterLink>
	);
};
