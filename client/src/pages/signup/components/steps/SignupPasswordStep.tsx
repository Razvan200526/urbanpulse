import type { InputPasswordRefType } from "@client/components/input/InputPassword";
import { InputPassword } from "@client/components/input/InputPassword";
import { Separator, Toast } from "@heroui/react";
import { useRef } from "react";
import { useSignupStore } from "../../signUpStore";
import { isPasswordValid } from "@shared/validators/isPasswordValid";
import { Button } from "@client/components/Button/Button";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { H2 } from "@client/components/typography";
export const SignupPasswordStep = () => {
	const passwordRef = useRef<InputPasswordRefType>(null);
	const confirmPasswordRef = useRef<InputPasswordRefType>(null);
	const { data, setData, setStep } = useSignupStore();

	const handleNext = () => {
		const password = passwordRef.current?.getValue() || "";
		const confirmPassword = confirmPasswordRef.current?.getValue() || "";

		if (!isPasswordValid(password) || !isPasswordValid(confirmPassword)) {
			Toast.toast.danger(
				"Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character",
			);
			return;
		}

		if (password !== confirmPassword) {
			Toast.toast.danger("Passwords do not match");
			return;
		}

		setData({
			...data,
			password,
		});

		setStep(2);
	};

	const handleBack = () => {
		setData({
			...data,
			password: "",
		});
		setStep(0);
	};

	return (
		<div className="w-full max-w-md mx-auto flex flex-col gap-6">
			<div className="flex flex-col gap-2">
				<H2>Secure Your Account</H2>
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
					minLength={6}
				/>

				<InputPassword
					ref={confirmPasswordRef}
					label="Confirm Password"
					placeholder="Re-enter your password"
					name="confirmPassword"
					initialValue=""
					required
					minLength={6}
				/>
			</div>

			<div className="flex items-center justify-between pt-4">
				<Button
					startContent={<ChevronLeftIcon className="size-4" />}
					onClick={handleBack}
				>
					Back
				</Button>
				<Button
					endContent={<ChevronRightIcon className="size-4" />}
					onClick={handleNext}
				>
					Next
				</Button>
			</div>
		</div>
	);
};
