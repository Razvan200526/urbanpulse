import { FeaturesSection } from "../components/FeaturesSection";
import { FooterSection } from "../components/FooterSection";
import { FloatingOrbs } from "../components/FloatingOrbs";
import HeroSection from "../components/HeroSection";
import { HowItWorksSection } from "../components/HowItWorksSection";
import { Navbar } from "../components/Navbar";
import { ParticleField } from "../components/ParticleField";

export const LandingPage = () => {
	return (
		<div className="relative w-full min-h-screen bg-(--background) overflow-x-hidden">
			<FloatingOrbs />
			<div className="fixed inset-0 z-0 pointer-events-none">
				<ParticleField />
			</div>

			<div className="relative z-10">
				<Navbar />
				<HeroSection />
				<FeaturesSection />
				<HowItWorksSection />
				<FooterSection />
			</div>
		</div>
	);
};
