import { Button } from "@client/components/Button/Button";
import {
	Dropdown,
	type DropdownItemDataType,
} from "@client/components/Dropdown";
import { ChevronRightIcon } from "@client/components/icons/ChevronRight";
import { H4 } from "@client/components/typography";
import { useIsMobile } from "@client/hooks/useMediaQuery";
import { cn, Dropdown as HeroDropdown } from "@heroui/react";
import { MoreVerticalIcon } from "lucide-react";

export const ConversationThreadHeader = ({
	dropdownItems,
	onBack,
	title,
	typingLabel,
}: {
	dropdownItems: DropdownItemDataType[];
	onBack: () => void;
	title: string;
	typingLabel: string | null;
}) => {
	const isMobile = useIsMobile();

	return (
		<div className="flex w-full shrink-0 items-center gap-3 border-b border-border px-4 py-3">
			{isMobile ? (
				<Button
					aria-label="Back"
					className="shrink-0"
					isIconOnly
					size="sm"
					radius="full"
					onPress={onBack}
					startContent={
						<ChevronRightIcon
							aria-hidden="true"
							className="size-4 rotate-180 text-accent"
							title="Back"
						/>
					}
					variant="ghost"
				/>
			) : null}

			<div className="flex w-full items-center justify-between gap-3">
				<div className="min-w-0">
					<H4 className="truncate text-accent">{title}</H4>
					<p
						className={cn(
							"text-xs",
							typingLabel ? "text-secondary-text" : "text-muted",
						)}
					>
						{typingLabel}
					</p>
				</div>

				<Dropdown
					className="border border-border"
					trigger={
						<HeroDropdown.Trigger className="rounded-full p-2 hover:bg-accent-soft-hover">
							<MoreVerticalIcon className="size-4 text-accent" />
						</HeroDropdown.Trigger>
					}
					items={dropdownItems}
				/>
			</div>
		</div>
	);
};
