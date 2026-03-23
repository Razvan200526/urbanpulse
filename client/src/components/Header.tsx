import { H3 } from "./typography";

export type HeaderProps = {
	title: string;
	tabs?: React.ReactNode;
	dropdown?: React.ReactNode;
};

/**
 *
 * @param title
 * @param tabs Use the Heroui Tabs component here to render them directly into the header,will be useful for filtering and showing data quickly without user hassle
 * @param dropdown Will be used to create delete update resources directly from the page,with a button trigger
 * @returns A header component with a title, tabs, and dropdown.It will be the same all over for consistent styling.
 */
export const Header = ({ title, tabs, dropdown }: HeaderProps) => {
	return (
		<div className="px-8 py-4 border-b border-border flex items-center justify-between bg-surface">
			<div className="flex items-center justify-start gap-2">
				<H3>{title}</H3>
				{tabs}
			</div>
			{dropdown}
		</div>
	);
};
