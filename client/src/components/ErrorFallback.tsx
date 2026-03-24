import { Card } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useState } from "react";
import { H3, H6 } from "./typography";
import { Button } from "./Button/Button";

export const ErrorFallback = ({ error }: { error: unknown }) => {
	const [showDetails, setShowDetails] = useState(false);

	const handleReload = () => {
		window.location.reload();
	};

	return (
		<div
			role="alert"
			className="min-h-screen bg-linear-to-br from-primary-100 to-danger-50 flex items-center justify-center p-4"
		>
			<Card className="shadow-none max-w-lg w-full p-8 text-center flex flex-col gap-10">
				<div className="mx-auto w-16 h-16 bg-danger-50 rounded-full flex items-center justify-center">
					<Icon icon="bx:error" className="text-danger size-10" />
				</div>

				<H3 className="text-danger">Oops! Something went wrong</H3>

				<p>
					We encountered an unexpected error. Don't worry, our team has been
					notified and we're working on a fix.
				</p>

				<Button onPress={handleReload} className="w-full">
					Try again
				</Button>

				<div className="flex flex-col gap-6 items-center">
					<Button
						onPress={() => setShowDetails(!showDetails)}
						variant="danger-soft"
						endContent={
							<Icon
								icon={
									showDetails
										? "iconamoon:arrow-up-2-duotone"
										: "iconamoon:arrow-down-2-duotone"
								}
								width="24"
								height="24"
							/>
						}
					>
						<span>Technical details</span>
					</Button>

					{showDetails && (
						<div className="p-4 bg-dark-50 rounded flex flex-col gap-4 items-start justify-start w-full">
							<H6 className="text-sm font-semibold">Error Details:</H6>
							<pre className="text-xs text-danger whitespace-pre-wrap wrap-break-word">
								{error instanceof Error ? error.message : String(error)}
							</pre>
							{error instanceof Error && error.stack && (
								<details className="flex flex-col gap-2 items-start justify-start">
									<summary className="text-xs text-dark-600 cursor-pointer hover:text-dark-800">
										Stack trace
									</summary>
									<pre className="text-xs text-dark-500 whitespace-pre-wrap wrap-break-word text-left">
										{error.stack}
									</pre>
								</details>
							)}
						</div>
					)}
				</div>
			</Card>
		</div>
	);
};
