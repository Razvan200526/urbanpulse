import { H3 } from "./typography";

export type HeaderProps = {
	title: string;
	tabs?: React.ReactNode;
	dropdown?: React.ReactNode;
	children?: React.ReactNode;
};

/**
 *
 * @param title
 * @param tabs Use the Heroui Tabs component here to render them directly into the header,will be useful for filtering and showing data quickly without user hassle
 * @param dropdown Will be used to create delete update resources directly from the page,with a button trigger
 * @returns A header component with a title, tabs, and dropdown.It will be the same all over for consistent styling.
 */
export const Header = ({ title, tabs, dropdown, children }: HeaderProps) => {
	return (
		<div className="sticky top-0 left-0 right-0 z-40 border-b border-border bg-surface px-4 py-3 sm:px-6 lg:px-8">
			<div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
				<div className="flex min-w-0 flex-col gap-3 md:flex-row md:items-center md:gap-4">
					<H3 className="truncate">{title}</H3>
					{tabs && <div className="w-full md:w-auto">{tabs}</div>}
				</div>
				<div className="flex flex-wrap items-stretch justify-start gap-2 md:justify-end">
					{children}
					{dropdown}
				</div>
			</div>
		</div>
	);
};
