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
	const baseClasses = cn(
		"px-2 py-2.5 w-full flex flex-row gap-2 items-center rounded",
		"transition-all duration-200 ease-in-out",
		"hover:bg-accent-hover/10",
		"active:scale-[0.98]",
	);

	const activeClasses = cn(
		"bg-accent-hover/20 border-l-4 rounded-l-none border-accent-hover",
		"shadow-[0_0_0_1px_rgba(var(--accent-rgb),0.1)]",
		"scale-[1.01]",
	);

	const iconClasses = cn(
		"size-5 transition-colors duration-200",
		"text-accent",
		"group-hover:text-accent-hover",
		"data-[active=true]:text-accent-hover",
	);

	const textClasses = cn(
		"font-primary transition-colors duration-200",
		"text-accent",
		"group-hover:text-accent-hover",
		"data-[active=true]:text-accent-hover",
	);

	return isMinimize ? (
		<Tooltip>
			<Tooltip.Trigger>
				<NavLink
					to={item.href}
					className={({ isActive }) =>
						cn(baseClasses, "justify-center", isActive && activeClasses)
					}
				>
					{({ isActive }) => (
						<item.icon
							className={cn(iconClasses, isActive && "text-accent-hover")}
							data-active={isActive || undefined}
						/>
					)}
				</NavLink>
			</Tooltip.Trigger>
			<Tooltip.Content className="rounded-full text-accent">
				{item.title}
			</Tooltip.Content>
		</Tooltip>
	) : (
		<NavLink
			to={item.href}
			className={({ isActive }) =>
				cn(baseClasses, "group", isActive && activeClasses)
			}
		>
			{({ isActive }) => (
				<>
					<item.icon
						className={cn(iconClasses, isActive && "text-accent-hover")}
						data-active={isActive || undefined}
					/>
					<span className={cn(textClasses, isActive && "text-accent-hover")}>
						{item.title}
					</span>
				</>
			)}
		</NavLink>
	);
};
