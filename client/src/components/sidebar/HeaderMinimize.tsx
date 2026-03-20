import logo from "@client/assets/logo.svg";

export const HeaderMinimize = () => {
	return (
		<div className="flex items-center gap-2 px-2">
			<div className="bg-surface flex h-8 w-8 items-center justify-center rounded-full">
				<img src={logo} alt="Logo" className="size-8 text-accent" />
			</div>
		</div>
	);
};
