import { PawPrint } from "lucide-react";

export const NoPetAlerts = () => {
	return (
		<div className="h-full w-full flex items-center justify-center">
			<div className="flex flex-col items-center">
				<div className="flex items-center justify-center gap-2">
					<PawPrint className="size-8 text-accent" />
					<p className="text-2xl font-semibold text-accent">
						No pet alerts found
					</p>
				</div>

				<p className="mt-1 text-sm text-muted">
					Be the first to report a lost or found pet in your neighborhood.
				</p>
			</div>
		</div>
	);
};
