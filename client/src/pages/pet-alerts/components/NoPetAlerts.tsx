import { PawPrint } from "lucide-react";

export const NoPetAlerts = () => {
	return (
		<div className="h-full w-full flex items-center justify-center p-4">
			<div className="flex flex-col items-center text-center">
				<div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3">
					<PawPrint className="size-6 sm:size-8 text-accent" />
					<p className="text-xl sm:text-2xl font-semibold text-accent leading-tight">
						No pet alerts found
					</p>
				</div>

				<p className="mt-2 text-xs sm:text-sm text-muted max-w-70 sm:max-w-md">
					Be the first to report a lost or found pet in your neighborhood.
				</p>
			</div>
		</div>
	);
};
