import { ProgressBar } from "@heroui/react";
import { Logo } from "./icons/Logo";
import { H1 } from "./typography";

export const PageLoader = () => {
	return (
		<div className="bg-surface flex flex-col items-center justify-center h-screen w-full">
			<div className="flex flex-col items-center justify-center gap-4 w-full max-w-xs">
				<div className="flex items-center justify-center gap-3">
					<Logo className="size-12" />
					<H1>UrbanPulse</H1>
				</div>
				<ProgressBar
					isIndeterminate
					color="accent"
					aria-label="Loading..."
					size="lg"
				>
					<ProgressBar.Output />
					<ProgressBar.Track className="rounded h-4">
						<ProgressBar.Fill />
					</ProgressBar.Track>
				</ProgressBar>
			</div>
		</div>
	);
};
