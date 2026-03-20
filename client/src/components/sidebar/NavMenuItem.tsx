import { cn, Tooltip } from "@heroui/react";
import { NavLink } from "react-router";

export const NavMenuItem = ({
	isMinimize,
	item,
}: {
	isMinimize: boolean;
	item: {
		key: string;
		href: string;
		icon: (props: React.SVGProps<SVGSVGElement>) => React.ReactNode;
		title: string;
	};
}) => {
	return isMinimize ? (
		<Tooltip>
			<Tooltip.Content className="text-accent">{item.title}</Tooltip.Content>
			<NavLink
				to={item.href}
				className={({ isActive }) =>
					cn(
						"px-2 py-2.5 w-full flex flex-row gap-2 items-center justify-start rounded",
						"hover:bg-accent-hover/10 transition-colors duration-150 ease-in",
						isActive
							? "bg-accent-hover/20 hover:bg-accent-hover/20 border-l-5 rounded-l-none border-accent-hover"
							: "",
						isMinimize ? "justify-center" : "",
					)
				}
			>
				{({ isActive }) => (
					<item.icon
						className={cn(
							"size-5",
							isActive ? "text-accent-hover" : "text-accent",
						)}
					/>
				)}
			</NavLink>
		</Tooltip>
	) : (
		<NavLink
			key={item.key}
			to={item.href}
			className={({ isActive }) =>
				cn(
					"px-2 py-2.5 w-full flex flex-row gap-2 items-center justify-start rounded",
					"hover:bg-hover",
					isActive
						? "bg-accent-hover/20 hover:bg-accent-hover/20 border-l-5 rounded-l-none border-accent-hover"
						: "",
					isMinimize ? "justify-center" : "",
				)
			}
		>
			{({ isActive }) => (
				<>
					<item.icon
						className={cn(
							"size-5",
							isActive ? "text-accent-hover" : "text-accent",
						)}
					/>
					<span
						className={cn(
							isActive ? "text-accent-hover" : "text-accent",
							"font-primary",
						)}
					>
						{item.title}
					</span>
				</>
			)}
		</NavLink>
	);
};
