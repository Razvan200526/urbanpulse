import { motion } from "motion/react";

const logos = [
	{ name: "Bucharest", text: "Bucharest" },
	{ name: "Cluj", text: "Cluj-Napoca" },
	{ name: "Timisoara", text: "Timisoara" },
	{ name: "Iasi", text: "Iasi" },
	{ name: "Brasov", text: "Brasov" },
	{ name: "Constanta", text: "Constanta" },
	{ name: "Sibiu", text: "Sibiu" },
	{ name: "Oradea", text: "Oradea" },
];

const allLogos = [...logos, ...logos];

export const TrustedByBar = () => {
	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ delay: 1.2, duration: 0.6 }}
			className="py-10"
		>
			<p className="text-center text-xs font-medium uppercase tracking-widest text-muted/50 mb-6">
				Trusted by communities across the country
			</p>

			<div className="relative overflow-hidden">
				<div className="absolute left-0 top-0 bottom-0 w-24 bg-linear-to-r from-(--background) to-transparent z-10 pointer-events-none" />
				<div className="absolute right-0 top-0 bottom-0 w-24 bg-linear-to-l from-(--background) to-transparent z-10 pointer-events-none" />

				<div className="flex items-center gap-12 animate-marquee">
					{allLogos.map((logo, i) => (
						<div
							key={`${logo.name}-${i}`}
							className="shrink-0 text-muted/30 text-sm font-semibold tracking-wide hover:text-secondary/60 transition-colors duration-300 select-none whitespace-nowrap"
						>
							{logo.text}
						</div>
					))}
				</div>
			</div>
		</motion.div>
	);
};
