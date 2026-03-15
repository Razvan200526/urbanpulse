import HeroSection from "../components/HeroSection";
import { Navbar } from "../components/Navbar";
import { FeaturesSection } from "../components/FeaturesSection";
import { HowItWorksSection } from "../components/HowItWorksSection";
import { CTASection } from "../components/CTASection";
import { FloatingOrbs } from "../components/FloatingOrbs";
import { ParticleField } from "../components/ParticleField";

export const LandingPage = () => {
	return (
		<div className="relative w-full min-h-screen bg-(--background) overflow-x-hidden">
			{/* Page-wide animated backgrounds */}
			<FloatingOrbs />
			<div className="fixed inset-0 z-0 pointer-events-none">
				<ParticleField />
			</div>

			{/* Content */}
			<div className="relative z-10">
				<Navbar />
				<HeroSection />
				<FeaturesSection />
				<HowItWorksSection />
				<CTASection />
			</div>
		</div>
	);
};
