/** biome-ignore-all lint/suspicious/noArrayIndexKey: <trust me> */
/** biome-ignore-all lint/suspicious/noTsIgnore: <trust me> */
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
	/**
	 * An array of steps.
	 *
	 * @default []
	 */
	steps?: HorizontalStepProps[];
	/**
	 * The color of the steps.
	 *
	 * @default "primary"
	 */
	/**
	 * The current step index.
	 */
	currentStep?: number;
	/**
	 * The default step index.
	 *
	 * @default 0
	 */
	defaultStep?: number;
	/**
	 * Whether to hide the progress bars.
	 *
	 * @default false
	 */
	hideProgressBars?: boolean;
	/**
	 * The custom class for the steps wrapper.
	 */
	className?: string;
	/**
	 * The custom class for the step.
	 */
	stepClassName?: string;
	/**
	 * Callback function when the step index changes.
	 */
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
				d="M5 13l4 4L19 7"
				initial={{ pathLength: 0 }}
				strokeLinecap="round"
				strokeLinejoin="round"
				transition={{
					delay: 0.2,
					type: "tween",
					ease: "easeOut",
					duration: 0.3,
				}}
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
			color = "primary",
			steps = [],
			defaultStep = 0,
			onStepChange,
			currentStep: currentStepProp,
			hideProgressBars = true,
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

		const colors = React.useMemo(() => {
			let userColor: any;
			let fgColor: any;

			const colorsVars = [
				"[--active-fg-color:var(--color-light)]",
				"[--active-border-color:var(--color-primary)]",
				"[--active-color:var(--color-primary)]",
				"[--complete-background-color:var(--color-primary)]",
				"[--complete-border-color:var(--color-primary)]",
				"[--inactive-border-color:var(--color-primary-300)]",
				"[--inactive-color:var(--color-primary-300)]",
			];

			switch (color) {
				case "primary":
					userColor = "[--step-color:var(--color-primary)]";
					fgColor = "[--step-fg-color:var(--color-light)]";
					break;
				case "secondary":
					userColor = "[--step-color:var(--color-secondary)]";
					fgColor = "[--step-fg-color:var(--color-secondary-400)]";
					break;
				case "success":
					userColor = "[--step-color:var(--color-success)]";
					fgColor = "[--step-fg-color:var(--color-light)]";
					break;
				case "warning":
					userColor = "[--step-color:var(--color-warning)]";
					fgColor = "[--step-fg-color:var(--color-light)]";
					break;
				case "danger":
					userColor = "[--step-color:var(--color-danger)]";
					fgColor = "[--step-fg-color:var(--color-light)]";
					break;
				case "default":
					userColor = "[--step-color:var(--color-primary)]";
					fgColor = "[--step-fg-color:var(--color-light)]";
					break;
				default:
					userColor = "[--step-color:var(--color-primary)]";
					fgColor = "[--step-fg-color:var(--color-light)]";
					break;
			}

			colorsVars.unshift(fgColor);
			colorsVars.unshift(userColor);

			return colorsVars;
		}, [color]);

		return (
			<nav aria-label="Progress" className="w-full overflow-x-auto">
				<ol
					className={cn(
						"flex w-full flex-row flex-nowrap items-center justify-center gap-8 md:gap-20",
						colors,
						className,
					)}
				>
					{steps?.map((step, stepIdx) => {
						const status =
							currentStep === stepIdx
								? "active"
								: currentStep < stepIdx
									? "inactive"
									: "complete";

						return (
							<li key={stepIdx} className="relative flex w-fit items-center">
								<button
									key={stepIdx}
									ref={ref}
									aria-current={status === "active" ? "step" : undefined}
									className={cn(
										"group flex w-full cursor-pointer flex-col items-center justify-center gap-y-2 rounded-large py-2.5",
										stepClassName,
									)}
									onClick={() => setCurrentStep(stepIdx)}
									{...props}
								>
									<div className="h-ful relative flex items-center">
										<LazyMotion features={domAnimation}>
											<m.div animate={status} className="relative">
												<m.div
													className={cn(
														"relative flex h-8.5 w-8.5 items-center justify-center rounded-full border-medium text-large font-semibold text-default-foreground",
														{
															"shadow-lg": status === "complete",
														},
													)}
													initial={false}
													transition={{ duration: 0.25 }}
													variants={{
														inactive: {
															backgroundColor: "var(--color-background)",
															borderColor: "var(--color-primary)",
															color: "var(--color-primary)",
														},
														active: {
															backgroundColor: "var(--color-background)",
															borderColor: "var(--step-color)",
															color: "var(--step-color)",
														},
														complete: {
															backgroundColor: "var(--step-color)",
															borderColor: "var(--step-color)",
														},
													}}
												>
													<div className="flex items-center justify-center">
														{status === "complete" ? (
															<CheckIcon className="h-6 w-6 text-(--step-fg-color)" />
														) : (
															<span>{stepIdx + 1}</span>
														)}
													</div>
												</m.div>
											</m.div>
										</LazyMotion>
										{stepIdx < steps.length - 1 && !hideProgressBars && (
											<div
												aria-hidden="true"
												className={cn(
													"pointer-events-none absolute top-1/2 left-3 hidden w-16 translate-x-1/2 -translate-y-1/2 items-center sm:left-1 sm:flex sm:w-18",
												)}
												style={{
													// @ts-ignore
													"--idx": stepIdx,
												}}
											>
												<div
													className={cn(
														"relative h-0.5 w-full bg-border-hover/30 transition-colors duration-300",
														"after:absolute after:block after:h-full after:w-0 after:bg-(--step-color) after:transition-[width] after:duration-300 after:content-['']",
														{
															"after:w-full": stepIdx < currentStep,
														},
													)}
												/>
											</div>
										)}
									</div>
									<div className="flex-1 px-2 text-center">
										<div
											className={cn(
												"line-clamp-2 text-small font-medium text-(--step-color) transition-[color,opacity] duration-300 group-active:opacity-80",
												{
													"text-(--step-color)": status === "inactive",
												},
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
