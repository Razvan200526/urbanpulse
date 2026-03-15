import { motion } from "motion/react";
import { Button } from "@heroui/react";

export const CTASection = () => {
	return (
		<section className="relative py-24 sm:py-32 overflow-hidden">
			<div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
				<motion.div
					initial={{ opacity: 0, y: 30 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true, margin: "-100px" }}
					transition={{ duration: 0.7, ease: "easeOut" }}
					className="text-center"
				>
					{/* CTA card */}
					<div className="relative mx-auto max-w-3xl rounded-3xl border border-border bg-(--surface)/40 backdrop-blur-sm p-12 sm:p-16 shadow-2xl overflow-hidden">
						{/* Accent border glow */}
						<div className="absolute -inset-px rounded-3xl bg-linear-to-br from-(--accent)/20 to-(--success)/20 pointer-events-none" />

						<div className="relative">
							<h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-(--foreground) tracking-tight">
								Ready to feel the pulse?
							</h2>
							<p className="mt-6 text-lg text-muted max-w-lg mx-auto">
								Join thousands of neighbours who already use UrbanPulse
								to stay informed, stay safe, and stay connected.
							</p>
							<div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
								<Button
									className="rounded-full px-10 py-3 text-base font-semibold w-full sm:w-auto"
									variant="primary"
									size="lg"
								>
									Sign Up for Free
								</Button>
								<a
									href="#features"
									className="inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-(--foreground) transition-colors no-underline"
								>
									Explore features
								</a>
							</div>
						</div>
					</div>
				</motion.div>
			</div>

			{/* Footer */}
			<div className="relative mt-20 border-t border-border">
				<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
					<p className="text-center text-sm text-muted">
						UrbanPulse 2026. Built for communities, by communities.
					</p>
				</div>
			</div>
		</section>
	);
};
