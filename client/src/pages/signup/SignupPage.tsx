import { Card } from "@heroui/react";
import { HorizontalSteps } from "../../components/HorizontalSteps";
import { Logo } from "../../components/icons/Logo";
import { H1 } from "../../components/typography";
import { SignupEmailStep } from "./components/steps/SignupEmailStep";
import { SignupOTPVerificationStep } from "./components/steps/SignupOTPVerificationStep";
import { SignupPasswordStep } from "./components/steps/SignupPasswordStep";
import { SignupProfileStep } from "./components/steps/SignupProfileStep";
import { useSignupStore } from "./signUpStore";

export const SignUpPage = () => {
	let content = <SignupEmailStep />;

	const { step } = useSignupStore();

	switch (step) {
		case 0:
			content = <SignupEmailStep />;
			break;
		case 1:
			content = <SignupPasswordStep />;
			break;
		case 2:
			content = <SignupProfileStep />;
			break;
		case 3:
			content = <SignupOTPVerificationStep />;
			break;
	}
	return (
		<div className="flex h-[calc(100dvh)] items-center justify-center bg-background">
			<div className="flex flex-col items-center justify-center gap-8 px-4 pt-8 sm:px-6">
				<div className="flex items-center justify-center">
					<Logo className="size-16" />
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
							title: "Password",
						},
						{
							title: "Profile",
						},
						{
							title: "Verification",
						},
					]}
				/>
				<Card className="flex w-full max-w-3xl flex-col gap-8 p-8 border border-accent bg-surface">
					{content}
				</Card>
			</div>
		</div>
	);
};
