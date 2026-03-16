/** biome-ignore-all lint/suspicious/noArrayIndexKey: intentional for static steps */
import { cn } from "@heroui/react";
import { useControlledState } from "@react-stately/utils";
import { domAnimation, LazyMotion, m } from "framer-motion";
import type { ComponentProps } from "react";
import React from "react";

export type HorizontalStepProps = {
	title?: React.ReactNode;
	className?: string;
};

export interface HorizontalStepsProps
	extends React.HTMLAttributes<HTMLButtonElement> {
	steps?: HorizontalStepProps[];
	currentStep?: number;
	defaultStep?: number;
	hideProgressBars?: boolean;
	className?: string;
	stepClassName?: string;
	onStepChange?: (stepIndex: number) => void;
}

function CheckIcon(props: ComponentProps<"svg">) {

	return (
		<svg
			{...props}
			fill="none"
			stroke="currentColor"
			strokeWidth={2}
			viewBox="0 0 24 24"
		>
			<m.path
				animate={{ pathLength: 1 }}
				initial={{ pathLength: 0 }}
				d="M5 13l4 4L19 7"
				strokeLinecap="round"
				strokeLinejoin="round"
				transition={{ delay: 0.15, duration: 0.3, ease: "easeOut" }}
			/>
		</svg>
	);
}

export const HorizontalSteps = React.forwardRef<
	HTMLButtonElement,
	HorizontalStepsProps
>(
	(
		{
			steps = [],
			defaultStep = 0,
			onStepChange,
			currentStep: currentStepProp,
			hideProgressBars = false,
			stepClassName,
			className,
			...props
		},
		ref,
	) => {
		const [currentStep, setCurrentStep] = useControlledState(
			currentStepProp,
			defaultStep,
			onStepChange,
		);

		return (
			<nav aria-label="Progress" className="w-full overflow-x-auto">
				<ol
					className={cn(
						"flex w-full flex-row flex-nowrap items-center justify-center gap-8 md:gap-20",
						className,
					)}
				>
					{steps.map((step, stepIdx) => {
						const status =
							currentStep === stepIdx
								? "active"
								: currentStep < stepIdx
									? "inactive"
									: "complete";

						return (
							<li key={stepIdx} className="relative flex w-fit items-center">
								<button
									ref={ref}
									aria-current={status === "active" ? "step" : undefined}
									onClick={() => setCurrentStep(stepIdx)}
									className={cn(
										"group flex w-full cursor-pointer flex-col items-center justify-center gap-y-2 rounded-lg py-2.5",
										stepClassName,
									)}
									{...props}
								>
									<div className="relative flex items-center">
										<LazyMotion features={domAnimation}>
											<m.div animate={status} className="relative">
												<m.div
													className={cn(
														"relative flex h-9 w-9 items-center justify-center rounded-full border text-sm font-semibold transition-shadow",
														{
															"shadow-lg": status === "complete",
														},
													)}
													initial={false}
													transition={{ duration: 0.25 }}
													variants={{
														inactive: {
															backgroundColor: "var(--surface)",
															borderColor: "var(--border)",
															color: "var(--muted)",
														},
														active: {
															backgroundColor: "var(--surface)",
															borderColor: "var(--accent)",
															color: "var(--accent)",
															boxShadow:
																"0 0 0 3px color-mix(in oklab, var(--accent) 22%, transparent)",
														},
														complete: {
															backgroundColor: "var(--accent)",
															borderColor: "var(--accent)",
															color: "var(--accent-foreground)",
														},
													}}
												>
													{status === "complete" ? (
														<CheckIcon className="h-5 w-5" />
													) : (
														<span>{stepIdx + 1}</span>
													)}
												</m.div>
											</m.div>
										</LazyMotion>

										{stepIdx < steps.length - 1 && !hideProgressBars && (
											<div
												aria-hidden="true"
												className="pointer-events-none absolute top-1/2 left-3 hidden w-16 translate-x-1/2 -translate-y-1/2 sm:left-1 sm:flex sm:w-20"
											>
												<div className="relative h-0.5 w-full bg-(--border)/70">
													<div
														className={cn(
															"absolute inset-y-0 left-0 bg-(--accent) transition-all duration-300",
															stepIdx < currentStep ? "w-full" : "w-0",
														)}
													/>
												</div>
											</div>
										)}
									</div>

									<div className="flex-1 px-2 text-center">
										<div
											className={cn(
												"line-clamp-2 text-sm font-medium transition-colors duration-300",
												status === "active" && "text-(--accent)",
												status === "complete" && "text-(--foreground)",
												status === "inactive" && "text-muted",
											)}
										>
											{step.title}
										</div>
									</div>
								</button>
							</li>
						);
					})}
				</ol>
			</nav>
		);
	},
);

HorizontalSteps.displayName = "HorizontalSteps";
