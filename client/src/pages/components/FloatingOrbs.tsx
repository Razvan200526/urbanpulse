import { motion } from "motion/react";

const orbs = [
	{
		size: "w-72 h-72",
		gradient: "from-primary/30 to-purple-500/20",
		position: "top-[-10%] left-[-5%]",
		delay: 0,
		duration: 20,
	},
	{
		size: "w-96 h-96",
		gradient: "from-fuchsia-400/20 to-primary/10",
		position: "top-[20%] right-[-10%]",
		delay: 3,
		duration: 25,
	},
	{
		size: "w-64 h-64",
		gradient: "from-secondary/25 to-orange-400/15",
		position: "bottom-[-15%] left-[30%]",
		delay: 6,
		duration: 22,
	},
	{
		size: "w-48 h-48",
		gradient: "from-primary/20 to-purple-600/20",
		position: "top-[50%] left-[60%]",
		delay: 9,
		duration: 18,
	},
];

export const FloatingOrbs = () => {
	return (
		<div
			className="absolute inset-0 overflow-hidden pointer-events-none"
			aria-hidden="true"
		>
			{orbs.map((orb, i) => (
				<motion.div
					key={i.toString()}
					initial={{ opacity: 0, scale: 0.8 }}
					animate={{
						opacity: [0, 1, 0.8, 1],
						scale: [0.8, 1.1, 0.9, 1],
						x: [0, 30, -20, 10, 0],
						y: [0, -25, 15, -10, 0],
					}}
					transition={{
						duration: orb.duration,
						delay: orb.delay,
						repeat: Number.POSITIVE_INFINITY,
						ease: "easeInOut",
					}}
					className={`absolute rounded-full bg-linear-to-br ${orb.gradient} ${orb.size} ${orb.position} blur-3xl mix-blend-screen`}
				/>
			))}
		</div>
	);
};
