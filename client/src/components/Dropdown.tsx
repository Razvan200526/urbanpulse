import {
	cn,
	Description,
	Dropdown as HeroDropdown,
	Kbd,
	Label,
} from "@heroui/react";
import type { Key, ReactElement, ReactNode } from "react";

export type DropdownItemDataType = {
	key: string;
	label: ReactNode;
	description?: ReactNode;
	className?: string;
	labelClassName?: string;
	shortcut?: string;
	icon?: ReactNode;
	endContent?: ReactNode;
	subMenu?: DropdownItemDataType[];
	onAction?: () => void | Promise<void>;
};

interface DropdownProps {
	trigger: ReactElement;
	items: DropdownItemDataType[];
	onAction?: (key: Key) => void;
	className?: string;
	placement?:
		| "bottom"
		| "bottom start"
		| "bottom end"
		| "top"
		| "top start"
		| "top end"
		| "left"
		| "right";
}

const RenderItems = ({ items }: { items: DropdownItemDataType[] }) => {
	return (
		<>
			{items.map((item) => {
				if (item.subMenu && item.subMenu.length > 0) {
					return (
						<HeroDropdown.SubmenuTrigger key={item.key}>
							<HeroDropdown.Item
								id={item.key}
								className={cn("flex items-center gap-2", item.className)}
								textValue={
									typeof item.label === "string" ? item.label : item.key
								}
							>
								<div className="flex flex-1 items-center gap-2">
									{item.icon}
									<Label>{item.label}</Label>
								</div>
								<HeroDropdown.SubmenuIndicator />
							</HeroDropdown.Item>
							<HeroDropdown.Popover>
								<HeroDropdown.Menu>
									<RenderItems items={item.subMenu} />
								</HeroDropdown.Menu>
							</HeroDropdown.Popover>
						</HeroDropdown.SubmenuTrigger>
					);
				}

				return (
					<HeroDropdown.Item
						key={item.key}
						id={item.key}
						className={cn("flex items-center gap-2", item.className)}
						onAction={item.onAction}
						textValue={typeof item.label === "string" ? item.label : item.key}
					>
						<div className="flex flex-1 items-center gap-2">
							{item.icon}
							<div className="flex flex-col">
								<Label className={item.labelClassName}>{item.label}</Label>
								{item.description && (
									<Description>{item.description}</Description>
								)}
							</div>
						</div>
						{item.shortcut && <Kbd slot="keyboard">{item.shortcut}</Kbd>}
						{item.endContent}
					</HeroDropdown.Item>
				);
			})}
		</>
	);
};

export const Dropdown = ({
	trigger,
	items,
	onAction,
	className,
	placement = "bottom start",
}: DropdownProps) => {
	return (
		<HeroDropdown>
			<HeroDropdown.Trigger>{trigger}</HeroDropdown.Trigger>
			<HeroDropdown.Popover
				placement={placement}
				className={cn(
					"min-w-48 shadow-xl rounded border border-accent",
					className,
				)}
			>
				<HeroDropdown.Menu onAction={onAction}>
					<RenderItems items={items} />
				</HeroDropdown.Menu>
			</HeroDropdown.Popover>
		</HeroDropdown>
	);
};
