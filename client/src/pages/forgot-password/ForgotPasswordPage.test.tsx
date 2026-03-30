import { beforeEach, describe, expect, mock, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";

const forgotState = {
	step: 0,
};

mock.module("./forgotPasswordStore", () => ({
	useForgotPasswordStore: () => ({
		step: forgotState.step,
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

mock.module("./components/steps/ForgotPasswordEmailStep", () => ({
	ForgotPasswordEmailStep: () => <div>Forgot Email Step</div>,
}));

mock.module("./components/steps/ForgotPasswordOTPVerificationStep", () => ({
	ForgotPasswordOTPVerificationStep: () => <div>Forgot OTP Step</div>,
}));

mock.module("./components/steps/ForgotPasswordNewPasswordStep", () => ({
	ForgotPasswordNewPasswordStep: () => <div>Forgot New Password Step</div>,
}));

const { ForgotPasswordPage } = await import("./ForgotPasswordPage");

describe("ForgotPasswordPage", () => {
	beforeEach(() => {
		forgotState.step = 0;
	});

	test("renders the email step by default", () => {
		const markup = renderToStaticMarkup(<ForgotPasswordPage />);

		expect(markup).toContain("Forgot Email Step");
		expect(markup).toContain("Current Step: 0");
	});

	test("renders the otp verification step", () => {
		forgotState.step = 1;

		const markup = renderToStaticMarkup(<ForgotPasswordPage />);

		expect(markup).toContain("Forgot OTP Step");
	});

	test("renders the new password step", () => {
		forgotState.step = 2;

		const markup = renderToStaticMarkup(<ForgotPasswordPage />);

		expect(markup).toContain("Forgot New Password Step");
	});

	test("falls back to the email step for unexpected step values", () => {
		forgotState.step = 42;

		const markup = renderToStaticMarkup(<ForgotPasswordPage />);

		expect(markup).toContain("Forgot Email Step");
	});
});
