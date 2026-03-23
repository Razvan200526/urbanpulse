import { Card } from "@heroui/react";
import { HorizontalSteps } from "../../components/HorizontalSteps";
import { Logo } from "../../components/icons/Logo";
import { H1 } from "../../components/typography";
import { ForgotPasswordEmailStep } from "./components/steps/ForgotPasswordEmailStep";
import { ForgotPasswordNewPasswordStep } from "./components/steps/ForgotPasswordNewPasswordStep";
import { ForgotPasswordOTPVerificationStep } from "./components/steps/ForgotPasswordOTPVerificationStep";
import { useForgotPasswordStore } from "./forgotPasswordStore";

export const ForgotPasswordPage = () => {
	const { step } = useForgotPasswordStore();

	let content = <ForgotPasswordEmailStep />;

	switch (step) {
		case 0:
			content = <ForgotPasswordEmailStep />;
			break;
		case 1:
			content = <ForgotPasswordOTPVerificationStep />;
			break;
		case 2:
			content = <ForgotPasswordNewPasswordStep />;
			break;
	}

	return (
		<div className="flex h-[calc(100dvh)] items-center justify-center bg-background">
			<div className="flex flex-col items-center justify-center gap-8 px-4 pt-8 sm:px-6">
				<div className="flex items-center justify-center">
					<Logo className="h-16 w-16" />
					<H1>UrbanPulse</H1>
				</div>
				<HorizontalSteps
					color="primary"
					defaultStep={0}
					currentStep={step}
					steps={[
						{
							title: "Email",
						},
						{
							title: "Verification",
						},
						{
							title: "New Password",
						},
					]}
				/>
				<Card className="flex w-full max-w-xl flex-col gap-8 p-8 border border-accent bg-surface">
					{content}
				</Card>
			</div>
		</div>
	);
};
