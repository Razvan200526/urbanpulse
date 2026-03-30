import { beforeEach, describe, expect, mock, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";

const signupState = {
	step: 0,
};

mock.module("./signUpStore", () => ({
	useSignupStore: () => ({
		step: signupState.step,
	}),
}));

mock.module("../../components/HorizontalSteps", () => ({
	HorizontalSteps: ({
		currentStep,
		steps,
	}: {
		currentStep: number;
		steps: Array<{ title: string }>;
	}) => (
		<div>
			<p>Current Step: {currentStep}</p>
			{steps.map((step) => (
				<span key={step.title}>{step.title}</span>
			))}
		</div>
	),
}));

mock.module("../../components/icons/Logo", () => ({
	Logo: () => <div>Logo</div>,
}));

mock.module("../../components/typography", () => ({
	H1: ({ children }: { children: React.ReactNode }) => <h1>{children}</h1>,
}));

mock.module("@heroui/react", () => ({
	Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

mock.module("./components/steps/SignupEmailStep", () => ({
	SignupEmailStep: () => <div>Signup Email Step</div>,
}));

mock.module("./components/steps/SignupPasswordStep", () => ({
	SignupPasswordStep: () => <div>Signup Password Step</div>,
}));

mock.module("./components/steps/SignupProfileStep", () => ({
	SignupProfileStep: () => <div>Signup Profile Step</div>,
}));

mock.module("./components/steps/SignupOTPVerificationStep", () => ({
	SignupOTPVerificationStep: () => <div>Signup OTP Step</div>,
}));

const { SignUpPage } = await import("./SignupPage");

describe("SignUpPage", () => {
	beforeEach(() => {
		signupState.step = 0;
	});

	test("renders the email step by default", () => {
		const markup = renderToStaticMarkup(<SignUpPage />);

		expect(markup).toContain("UrbanPulse");
		expect(markup).toContain("Signup Email Step");
		expect(markup).toContain("Current Step: 0");
	});

	test("renders the password step", () => {
		signupState.step = 1;

		const markup = renderToStaticMarkup(<SignUpPage />);

		expect(markup).toContain("Signup Password Step");
		expect(markup).not.toContain("Signup Email Step");
	});

	test("renders the profile step", () => {
		signupState.step = 2;

		const markup = renderToStaticMarkup(<SignUpPage />);

		expect(markup).toContain("Signup Profile Step");
	});

	test("renders the otp verification step", () => {
		signupState.step = 3;

		const markup = renderToStaticMarkup(<SignUpPage />);

		expect(markup).toContain("Signup OTP Step");
	});

	test("falls back to the email step for unexpected step values", () => {
		signupState.step = 99;

		const markup = renderToStaticMarkup(<SignUpPage />);

		expect(markup).toContain("Signup Email Step");
	});
});
