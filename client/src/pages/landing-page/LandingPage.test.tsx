import { describe, expect, mock, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";

mock.module("../components/Navbar", () => ({
	Navbar: () => <div>Landing Navbar</div>,
}));

mock.module("../components/HeroSection", () => ({
	__esModule: true,
	default: () => <div>Landing Hero</div>,
}));

mock.module("../components/FeaturesSection", () => ({
	FeaturesSection: () => <div>Landing Features</div>,
}));

mock.module("../components/HowItWorksSection", () => ({
	HowItWorksSection: () => <div>Landing How It Works</div>,
}));

mock.module("../components/CTASection", () => ({
	CTASection: () => <div>Landing CTA</div>,
}));

mock.module("../components/FloatingOrbs", () => ({
	FloatingOrbs: () => <div>Floating Orbs</div>,
}));

mock.module("../components/ParticleField", () => ({
	ParticleField: () => <div>Particle Field</div>,
}));

const { LandingPage } = await import("./LandingPage");

describe("LandingPage", () => {
	test("renders the landing page sections in order", () => {
		const markup = renderToStaticMarkup(<LandingPage />);

		expect(markup).toContain("Floating Orbs");
		expect(markup).toContain("Particle Field");
		expect(markup).toContain("Landing Navbar");
		expect(markup).toContain("Landing Hero");
		expect(markup).toContain("Landing Features");
		expect(markup).toContain("Landing How It Works");
		expect(markup).toContain("Landing CTA");
	});
});
