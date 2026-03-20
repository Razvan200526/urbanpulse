import type { InputPasswordRefType } from "@client/components/input/InputPassword";
import { InputPassword } from "@client/components/input/InputPassword";
import { Button, Separator } from "@heroui/react";
import { useRef } from "react";
import { useNavigate } from "react-router";
import { useForgotPasswordStore } from "../../forgotPasswordStore";
import { useResetPassword } from "../../hooks";

export const ForgotPasswordNewPasswordStep = () => {
	const passwordRef = useRef<InputPasswordRefType>(null);
	const confirmPasswordRef = useRef<InputPasswordRefType>(null);
	const { setStep, clear, email, otp } = useForgotPasswordStore();
	const { mutateAsync: resetPassword } = useResetPassword();
	const navigate = useNavigate();

	const handleNext = async () => {
		const isPasswordValid = passwordRef.current?.validate();
		const isConfirmValid = confirmPasswordRef.current?.validate();

		if (!isPasswordValid || !isConfirmValid) {
			return;
		}

		const password = passwordRef.current?.getValue() || "";
		const confirmPassword = confirmPasswordRef.current?.getValue() || "";

		if (password !== confirmPassword) {
			console.error("Passwords do not match");
			return;
		}

		const res = await resetPassword({ email, password, otp });
		if (res?.success) {
			clear();
			navigate("/signin");
		}
	};

	const handleBack = () => {
		setStep(1);
	};

	return (
		<div className="w-full max-w-md mx-auto flex flex-col gap-6">
			<div className="flex flex-col gap-2">
				<h2 className="text-2xl font-bold text-(--foreground)">
					Reset Your Password
				</h2>
				<p className="text-sm text-muted">
					Create a strong password to protect your account
				</p>
			</div>

			<Separator />

			<div className="flex flex-col gap-4">
				<InputPassword
					ref={passwordRef}
					label="New Password"
					placeholder="Enter a strong password"
					name="password"
					initialValue=""
					required
					minLength={8}
				/>

				<InputPassword
					ref={confirmPasswordRef}
					label="Confirm New Password"
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
					Reset Password
				</Button>
			</div>
		</div>
	);
};
