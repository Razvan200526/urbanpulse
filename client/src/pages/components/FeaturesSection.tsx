import { Chip } from "@heroui/react";
import type { Easing } from "motion/react";
import { motion } from "motion/react";
import { features } from "./featuresData";

const fadeInUp = {
	hidden: { opacity: 0, y: 20 },
	visible: {
		opacity: 1,
		y: 0,
		transition: {
			duration: 0.6,
			ease: "easeOut" as Easing,
		},
	},
};

const staggerContainer = {
	hidden: {},
	visible: {
		transition: {
			staggerChildren: 0.08,
		},
	},
};

const cardVariants = {
	hidden: { opacity: 0, y: 30 },
	visible: (i: number) => ({
		opacity: 1,
		y: 0,
		transition: {
			duration: 0.6,
			delay: i * 0.08,
			ease: "easeOut" as Easing,
		},
	}),
};

/* Per-card rounding for outer edges of the bento grid */
const cardRounding = [
	/* [0] top-left     */ "max-lg:rounded-t-4xl lg:rounded-tl-4xl",
	/* [1] top-right    */ "lg:rounded-tr-4xl",
	/* [2] bottom-left  */ "lg:rounded-bl-4xl",
	/* [3]              */ "",
	/* [4] bottom-right */ "max-lg:rounded-b-4xl lg:rounded-br-4xl",
];

const innerRounding = [
	"max-lg:rounded-t-[calc(2rem+1px)] lg:rounded-tl-[calc(2rem+1px)]",
	"lg:rounded-tr-[calc(2rem+1px)]",
	"lg:rounded-bl-[calc(2rem+1px)]",
	"",
	"max-lg:rounded-b-[calc(2rem+1px)] lg:rounded-br-[calc(2rem+1px)]",
];

export const FeaturesSection = () => {
	return (
		<section id="features" className="py-24 sm:py-32 relative overflow-hidden">
			<div className="mx-auto max-w-2xl px-6 lg:max-w-7xl lg:px-8 relative z-10">
				{/* Section header */}
				<motion.div
					initial="hidden"
					whileInView="visible"
					viewport={{ once: true, amount: 0.3 }}
					variants={fadeInUp}
					className="flex flex-col gap-3 mb-10 sm:mb-16"
				>
					<Chip
						variant="flat"
						color="primary"
						size="sm"
						classNames={{
							base: "bg-primary/10 border border-primary/20",
							content:
								"text-primary font-semibold tracking-wide text-xs",
						}}
					>
						Features
					</Chip>

					<h2 className="max-w-lg text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-pretty text-(--foreground) leading-tight">
						Everything you need to{" "}
						<span className="text-transparent bg-clip-text bg-linear-to-r from-primary via-fuchsia-400 to-secondary">
							stay connected
						</span>
					</h2>
				</motion.div>

				{/* Bento grid */}
				<motion.div
					initial="hidden"
					whileInView="visible"
					viewport={{ once: true, amount: 0.05 }}
					variants={staggerContainer}
					className="grid grid-cols-1 gap-4 lg:grid-cols-6 lg:grid-rows-2"
				>
					{features.map((feature, i) => {
						const Icon = feature.icon;
						const colSpan = i < 2 ? "lg:col-span-3" : "lg:col-span-2";

						return (
							<motion.div
								key={feature.label}
								custom={i}
								variants={cardVariants}
								className={`group relative ${colSpan}`}
							>
								{/* Background */}
								<div
									className={`absolute inset-0 rounded-lg bg-(--surface)/60 backdrop-blur-sm ${cardRounding[i]}`}
								/>

								{/* Inner content */}
								<div
									className={`relative flex h-full flex-col overflow-hidden rounded-[calc(var(--radius-lg)+1px)] ${innerRounding[i]}`}
								>
									{/* Icon visual area */}
									<div
										className={`flex items-center justify-center h-52 bg-linear-to-br ${feature.gradient}`}
									>
										<Icon className="size-16 text-(--foreground)/60" />
									</div>

									{/* Text content */}
									<div className="p-8 pt-4">
										<h3 className="text-sm/4 font-semibold text-primary">
											{feature.label}
										</h3>
										<p className="mt-2 text-lg font-medium tracking-tight text-(--foreground)">
											{feature.title}
										</p>
										<p className="mt-2 max-w-lg text-sm/6 text-muted">
											{feature.description}
										</p>
									</div>
								</div>

								{/* Border outline — transitions on hover */}
								<div
									className={`pointer-events-none absolute inset-0 rounded-lg outline outline-1 outline-border transition-all duration-300 group-hover:outline-primary/40 group-hover:outline-2 ${cardRounding[i]}`}
								/>
							</motion.div>
						);
					})}
				</motion.div>
			</div>
		</section>
	);
};
