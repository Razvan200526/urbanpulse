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
				"decoration-none cursor-pointer tracking-wide text-accent underline-offset-4 outline-0 select-none disabled:cursor-not-allowed disabled:opacity-50",
				"relative before:absolute before:-bottom-0.5 before:left-0 before:block before:h-0.5 before:w-full before:content-['']",
				"before:bg-accent before:scale-x-0 before:transition-transform before:duration-300 hover:before:scale-x-100",
				"font-medium",
				props.className,
			)}
		>
			{props.children}
		</RouterLink>
	);
};
