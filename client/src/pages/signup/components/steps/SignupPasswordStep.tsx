import type { InputPasswordRefType } from "@client/components/input/InputPassword";
import { InputPassword } from "@client/components/input/InputPassword";
import { Button, Separator } from "@heroui/react";
import { useRef } from "react";
import { useSignupStore } from "../../signUpStore";

export const SignupPasswordStep = () => {
	const passwordRef = useRef<InputPasswordRefType>(null);
	const confirmPasswordRef = useRef<InputPasswordRefType>(null);
	const { data, setData, setStep } = useSignupStore();

	const handleNext = () => {
		const isPasswordValid = passwordRef.current?.validate();
		const isConfirmValid = confirmPasswordRef.current?.validate();

		if (!isPasswordValid || !isConfirmValid) {
			return;
		}

		const password = passwordRef.current?.getValue() ?? "";
		const confirmPassword = confirmPasswordRef.current?.getValue() ?? "";

		if (password !== confirmPassword) {
			console.error("Passwords do not match");
			return;
		}

		setData({
			...data,
			password,
		});

		setStep(2);
	};

	const handleBack = () => {
		setStep(0);
	};

	return (
		<div className="w-full max-w-md mx-auto flex flex-col gap-6">
			<div className="flex flex-col gap-2">
				<h2 className="text-2xl font-bold text-(--foreground)">
					Secure Your Account
				</h2>
				<p className="text-sm text-muted">
					Create a strong password to protect your account
				</p>
			</div>

			<Separator />

			<div className="flex flex-col gap-4">
				<InputPassword
					ref={passwordRef}
					label="Password"
					placeholder="Enter a strong password"
					name="password"
					initialValue={data.password}
					required
					minLength={8}
				/>

				<InputPassword
					ref={confirmPasswordRef}
					label="Confirm Password"
					placeholder="Re-enter your password"
					name="confirmPassword"
					initialValue=""
					required
					minLength={8}
				/>
			</div>

			<div className="flex gap-3 pt-4">
				<Button variant="primary" className="flex-1" onClick={handleBack}>
					Back
				</Button>
				<Button
					className="flex-1 rounded"
					variant="primary"
					onClick={handleNext}
				>
					Next
				</Button>
			</div>
		</div>
	);
};
