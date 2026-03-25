export const MetaRow = ({
	label,
	children,
}: {
	label: string;
	children: React.ReactNode;
}) => {
	return (
		<div className="flex items-center justify-between py-3 last:border-0">
			<span className="text-xs font-medium tracking-widest uppercase text-muted">
				{label}
			</span>
			<div className="text-sm font-medium text-(--foreground)">{children}</div>
		</div>
	);
};
