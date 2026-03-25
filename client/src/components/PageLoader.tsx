import { ProgressBar } from "@heroui/react";
import { Logo } from "./icons/Logo";
import { H1 } from "./typography";

export const PageLoader = () => {
	return (
		<div className="flex flex-col items-center justify-center h-[calc(100dvh-3.9rem)] w-full">
			<div className="flex flex-col items-center justify-center gap-4 w-full max-w-xs h-full">
				<div className="flex items-center justify-center gap-3">
					<Logo className="size-12" />
					<H1>UrbanPulse</H1>
				</div>
				<ProgressBar
					isIndeterminate
					color="accent"
					aria-label="Loading..."
					size="lg"
				/>
			</div>
		</div>
	);
};
