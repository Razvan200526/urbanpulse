import type { Easing } from "motion/react";
import { motion } from "motion/react";
import { HandRaisedIcon } from "../../components/icons/HandRaisedIcon";
import { LocationIcon } from "../../components/icons/LocationIcon";
import { SignalIcon } from "../../components/icons/SignalIcon";
import { H2 } from "../../components/typography";

const steps = [
	{
		icon: LocationIcon,
		number: "01",
		title: "Enable Location",
		description:
			"Share your location to discover live pulses and incidents happening in your immediate area.",
	},
	{
		icon: SignalIcon,
		number: "02",
		title: "Stay Informed",
		description:
			"Watch pulse markers update in real-time on the map as your community reports what matters.",
	},
	{
		icon: HandRaisedIcon,
		number: "03",
		title: "Take Action",
		description:
			"Respond to alerts, report new incidents, or reach out to neighbours who need a hand.",
	},
];

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
			staggerChildren: 0.15,
		},
	},
};

const stepVariants = {
	hidden: { opacity: 0, y: 30 },
	visible: {
		opacity: 1,
		y: 0,
		transition: {
			duration: 0.6,
			ease: "easeOut" as Easing,
		},
	},
};

export const HowItWorksSection = () => {
	return (
		<section
			id="how-it-works"
			className="relative py-24 sm:py-32 overflow-hidden"
		>
			<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
				{/* Section header */}
				<motion.div
					initial="hidden"
					whileInView="visible"
					viewport={{ once: true, amount: 0.3 }}
					variants={fadeInUp}
					className="flex flex-col gap-3 mb-20"
				>
					<H2 className="text-primary text-3xl md:text-5xl font-bold leading-tight tracking-tight max-w-xl">
						Get started in{" "}
						<span className="text-transparent bg-clip-text bg-linear-to-r from-primary via-fuchsia-400 to-secondary">
							three simple steps
						</span>
					</H2>
				</motion.div>

				<motion.div
					variants={staggerContainer}
					initial="hidden"
					whileInView="visible"
					viewport={{ once: true, margin: "-80px" }}
					className="relative grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8"
				>
					<div className="hidden md:block absolute top-12 left-[16.666%] right-[16.666%] h-px bg-linear-to-r from-(--accent)/40 via-border to-(--accent)/40" />

					{steps.map((step) => (
						<motion.div
							key={step.number}
							variants={stepVariants}
							className="relative flex flex-col items-center text-center"
						>
							<div className="relative mb-8">
								<div className="w-24 h-24 rounded-full bg-(--surface)/40 backdrop-blur-sm border-2 border-border flex items-center justify-center shadow-lg">
									<step.icon className="size-10 text-(--accent)" />
								</div>
								<span className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-(--accent) text-white text-xs font-bold flex items-center justify-center shadow-md">
									{step.number}
								</span>
							</div>

							<h3 className="text-xl font-semibold text-(--foreground) mb-3">
								{step.title}
							</h3>
							<p className="text-muted leading-relaxed max-w-xs">
								{step.description}
							</p>
						</motion.div>
					))}
				</motion.div>
			</div>
		</section>
	);
};
