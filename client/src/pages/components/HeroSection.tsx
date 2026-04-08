import { Button } from "@client/components/Button/Button";
import { motion } from "motion/react";
import { useNavigate } from "react-router";
import logo from "../../assets/logo.svg";
import { MapPreview } from "./MapPreview";
import { TrustedByBar } from "./TrustedByBar";

export default function HeroSection() {
	const navigate = useNavigate();
	return (
		<section id="hero" className="relative min-h-screen overflow-hidden">
			<div className="relative z-2 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-28 pb-20 lg:pt-40 lg:pb-32">
				<div className="lg:grid lg:grid-cols-2 lg:gap-x-12 lg:items-center">
					<div className="max-w-2xl lg:max-w-none">
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

						<motion.div
							initial={{ opacity: 0, y: 30 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.7, delay: 0.45, ease: "easeOut" }}
							className="mt-10 flex flex-wrap items-center gap-4"
						>
							<Button
								onPress={() => navigate("/signup")}
								variant="primary"
								size="lg"
							>
								Get Started
							</Button>
							<a
								href="#how-it-works"
								className="inline-flex h-10 w-30 border border-border rounded items-center justify-center text-foreground font-semibold transition-colors duration-150 ease-out hover:border-accent hover:text-accent hover:bg-accent-soft-hover"
							>
								Learn More
							</a>
						</motion.div>

						<motion.div
							initial={{ opacity: 0, y: 30 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.7, delay: 0.6, ease: "easeOut" }}
							className="mt-12 flex items-center gap-6"
						>
							<p className="text-sm text-muted">
								<span className="font-semibold text-accent">50+</span> community
								members already connected
							</p>
						</motion.div>
					</div>

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
						<div className="absolute -inset-4 rounded-2xl bg-linear-to-r from-accent-soft-hover to-success-soft-hover blur-2xl opacity-60 pointer-events-none" />

						<div className="relative rounded overflow-hidden border border-border bg-surface/40 backdrop-blur-sm shadow-2xl">
							<div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-surface/30">
								<div className="w-3 h-3 rounded-full bg-danger" />
								<div className="w-3 h-3 rounded-full bg-warning" />
								<div className="w-3 h-3 rounded-full bg-success" />
								<span className="ml-3 text-xs text-muted font-medium">
									Live Map — Your Area
								</span>
							</div>
							<MapPreview />
						</div>
					</motion.div>
				</div>

				<TrustedByBar />
			</div>
		</section>
	);
}
