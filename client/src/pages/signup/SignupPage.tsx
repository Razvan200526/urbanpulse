import { Card } from "@heroui/react";
import { SignupEmailStep } from "./components/steps/SignupEmailStep";
import { HorizontalSteps } from "../../components/HorizontalSteps";
import { useSignupStore } from "./signUpStore";

export const SignUpPage = () => {
	const content = <SignupEmailStep />;

	const { step } = useSignupStore();
	return (
		<div className="flex h-[calc(100dvh)] items-center justify-center bg-background">
			<div className="flex flex-col items-center justify-center gap-8 px-4 pt-8 sm:px-6">
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
				<Card className="flex w-full max-w-xl flex-col gap-8 p-8">
					{content}
				</Card>
			</div>
		</div>
	);
};
