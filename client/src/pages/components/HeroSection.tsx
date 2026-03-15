import { motion } from "motion/react";
import logo from "../../assets/logo.svg";
import { Button } from "@heroui/react";
import { MapComponent } from "./MapPreview";
import { TrustedByBar } from "./TrustedByBar";

export default function HeroSection() {
	return (
		<section id="hero" className="relative min-h-screen overflow-hidden">
			<div className="relative z-2 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-28 pb-20 lg:pt-40 lg:pb-32">
				<div className="lg:grid lg:grid-cols-2 lg:gap-x-12 lg:items-center">
					{/* Text content */}
					<div className="max-w-2xl lg:max-w-none">
						{/* Logo badge */}
						<motion.div
							initial={{ opacity: 0, y: 30 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.7, ease: "easeOut" }}
							className="flex items-center gap-3 mb-8"
						>
							<div className="flex items-center gap-2 px-4 py-2 rounded-full bg-(--surface)/40 backdrop-blur-sm border border-border">
								<img src={logo} alt="UrbanPulse" className="h-6 w-6" />
								<span className="text-sm font-semibold text-(--foreground) tracking-wide uppercase">
									UrbanPulse
								</span>
							</div>
						</motion.div>

						{/* Heading */}
						<motion.h1
							initial={{ opacity: 0, y: 30 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.7, delay: 0.15, ease: "easeOut" }}
							className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-(--foreground) leading-[1.1]"
						>
							Your Neighbourhood,{" "}
							<span className="text-transparent bg-clip-text bg-linear-to-r from-(--accent) to-(--success)">
								In Real-Time
							</span>
						</motion.h1>

						{/* Subtitle */}
						<motion.p
							initial={{ opacity: 0, y: 30 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.7, delay: 0.3, ease: "easeOut" }}
							className="mt-6 text-lg sm:text-xl text-muted leading-relaxed max-w-xl"
						>
							Stay connected with your community. See live incidents, share
							alerts, and respond to neighbours who need help — all on one
							interactive map.
						</motion.p>

						{/* CTA buttons */}
						<motion.div
							initial={{ opacity: 0, y: 30 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.7, delay: 0.45, ease: "easeOut" }}
							className="mt-10 flex flex-wrap items-center gap-4"
						>
							<Button
								className="rounded-full px-8 py-3 text-base font-semibold"
								variant="primary"
								size="lg"
							>
								Get Started
							</Button>
							<a
								href="#how-it-works"
								className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-border text-(--foreground) text-base font-medium hover:bg-(--surface)/40 transition-colors no-underline"
							>
								Learn More
							</a>
						</motion.div>

						{/* Social proof */}
						<motion.div
							initial={{ opacity: 0, y: 30 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.7, delay: 0.6, ease: "easeOut" }}
							className="mt-12 flex items-center gap-6"
						>
							<div className="flex -space-x-2">
								{(
									[
										["bg-(--accent)", "A"],
										["bg-(--success)", "B"],
										["bg-(--warning)", "C"],
										["bg-(--danger)", "D"],
									] as const
								).map(([bg, letter]) => (
									<div
										key={letter}
										className={`w-8 h-8 rounded-full ${bg} border-2 border-(--background) flex items-center justify-center text-xs font-bold text-white`}
									>
										{letter}
									</div>
								))}
							</div>
							<p className="text-sm text-muted">
								<span className="font-semibold text-(--foreground)">
									2,000+
								</span>{" "}
								community members already connected
							</p>
						</motion.div>
					</div>

					{/* Map preview */}
					<motion.div
						initial={{ opacity: 0, scale: 0.95, x: 40 }}
						animate={{ opacity: 1, scale: 1, x: 0 }}
						transition={{
							duration: 0.9,
							delay: 0.3,
							ease: "easeOut",
						}}
						className="mt-16 lg:mt-0 relative"
					>
						{/* Glow behind map */}
						<div className="absolute -inset-4 rounded-2xl bg-linear-to-r from-(--accent)/20 to-(--success)/20 blur-2xl opacity-60 pointer-events-none" />

						{/* Glassmorphic card */}
						<div className="relative rounded-2xl overflow-hidden border border-border bg-(--surface)/40 backdrop-blur-sm shadow-2xl">
							{/* Top bar */}
							<div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-(--surface)/30">
								<div className="w-3 h-3 rounded-full bg-(--danger)" />
								<div className="w-3 h-3 rounded-full bg-(--warning)" />
								<div className="w-3 h-3 rounded-full bg-(--success)" />
								<span className="ml-3 text-xs text-muted font-medium">
									Live Map — Your Area
								</span>
							</div>
							<MapComponent />
						</div>
					</motion.div>
				</div>

				{/* Trusted by bar */}
				<TrustedByBar />
			</div>
		</section>
	);
}
