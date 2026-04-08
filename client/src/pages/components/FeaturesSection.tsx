import { H2 } from "@client/components/typography";
import type { Easing } from "motion/react";
import { motion } from "motion/react";
import { FeatureCard } from "./FeatureCard";
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
	hidden: { opacity: 0, y: 30, scale: 0.97 },
	visible: (i: number) => ({
		opacity: 1,
		y: 0,
		scale: 1,
		transition: {
			duration: 0.6,
			delay: i * 0.08,
			ease: "easeOut" as Easing,
		},
	}),
};

export const FeaturesSection = () => {
	return (
		<section id="features" className="relative overflow-hidden py-24 sm:py-32">
			<div
				aria-hidden="true"
				className="pointer-events-none absolute inset-0"
			/>

			<div className="relative z-10 mx-auto flex max-w-7xl justify-center px-4 md:px-10 lg:px-16">
				<div className="flex w-full max-w-6xl flex-col gap-12">
					<motion.div
						initial="hidden"
						whileInView="visible"
						viewport={{ once: true, amount: 0.3 }}
						variants={fadeInUp}
						className="flex flex-col gap-3"
					>
						<H2 className="max-w-2xl text-foreground text-3xl font-bold leading-tight tracking-tight md:text-5xl">
							Everything you need to{" "}
							<span className="bg-linear-to-r from-primary via-fuchsia-400 to-secondary bg-clip-text text-transparent">
								stay connected
							</span>
						</H2>
					</motion.div>

					<motion.div
						initial="hidden"
						whileInView="visible"
						viewport={{ once: true, amount: 0.05 }}
						variants={staggerContainer}
						className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6 lg:grid-rows-2"
					>
						{features.map((feature, i) => {
							const colSpan = i < 2 ? "lg:col-span-3" : "lg:col-span-2";

							return (
								<motion.div
									key={feature.label}
									custom={i}
									variants={cardVariants}
									className={colSpan}
								>
									<FeatureCard {...feature} />
								</motion.div>
							);
						})}
					</motion.div>
				</div>
			</div>
		</section>
	);
};
