import { motion } from "motion/react";
import logo from "../assets/logo.svg";

export const Loader = () => {
	return (
		<div className="flex flex-col items-center justify-center min-h-screen bg-(--background)">
			<div className="flex items-center gap-3 mb-8">
				<img src={logo} alt="UrbanPulse" className="h-12 w-12" />
				<h1 className="text-2xl font-bold tracking-wide text-(--foreground)">
					UrbanPulse
				</h1>
			</div>
			{/* Load Bar */}
			<div className="w-64 h-1 bg-default rounded-full overflow-hidden">
				<motion.div
					className="h-full bg-primary"
					initial={{ width: "0%", x: "-100%" }}
					animate={{ width: "40%", x: "250%" }}
					transition={{
						duration: 1.5,
						repeat: Infinity,
						ease: "easeInOut",
					}}
				/>
			</div>
		</div>
	);
};
