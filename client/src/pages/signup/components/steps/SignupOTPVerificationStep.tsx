import { H1 } from "@client/components/typography";
import { Button, Input, Separator } from "@heroui/react";
import { useEffect, useState } from "react";
import { useSignupStore } from "../../signUpStore";

export const SignupOTPVerificationStep = () => {
	const { data, setStep, clear } = useSignupStore();
	const [otp, setOtp] = useState<string>("");
	const [timeLeft, setTimeLeft] = useState<number>(300); // 5 minutes
	const [isLoading, setIsLoading] = useState(false);
	const [_error, setError] = useState<string>("");

	// Countdown timer
	useEffect(() => {
		if (timeLeft <= 0) return;

		const timer = setTimeout(() => {
			setTimeLeft(timeLeft - 1);
		}, 1000);

		return () => clearTimeout(timer);
	}, [timeLeft]);

	const formatTime = (seconds: number) => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins}:${secs.toString().padStart(2, "0")}`;
	};

	const handleVerifyOTP = async () => {
		if (otp.length !== 6) {
			setError("OTP must be 6 digits");
			return;
		}

		setIsLoading(true);
		setError("");

		try {
			// Simulating API call
			await new Promise((resolve) => setTimeout(resolve, 1500));

			clear();
			setStep(0);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to verify OTP");
		} finally {
			setIsLoading(false);
		}
	};

	const handleResendOTP = async () => {
		setIsLoading(true);
		try {
			setTimeLeft(300);
			setOtp("");
			setError("");
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to resend OTP");
		} finally {
			setIsLoading(false);
		}
	};

	const handleBack = () => {
		setStep(2);
	};

	return (
		<div className="w-full max-w-md mx-auto flex flex-col gap-6">
			<div className="flex flex-col gap-2">
				<h2 className="text-2xl font-bold text-(--foreground)">
					Verify Your Email
				</h2>
				<p className="text-sm text-muted">
					We've sent a verification code to{" "}
					<span className="font-semibold text-(--foreground)">
						{data.email}
					</span>
				</p>
			</div>

			<Separator />

			<div className="flex flex-col gap-4">
				{/* OTP Input */}
				<div className="flex flex-col gap-2">
					<H1 className="text-accent font-semibold">Verification Code</H1>
					<Input
						type="text"
						placeholder="000000"
						value={otp}
						onChange={(e: any) => {
							const val = e.target?.value || e;
							const cleanVal =
								typeof val === "string"
									? val.replace(/\D/g, "").slice(0, 6)
									: "";
							setOtp(cleanVal);
						}}
						maxLength={6}
					/>
				</div>

				{/* Timer */}
				<div className="flex items-center justify-between p-3 bg-surface rounded-lg border border-border">
					<span className="text-sm text-muted">Code expires in</span>
					<span
						className={`text-base font-mono font-semibold ${
							timeLeft < 60 ? "text-danger" : "text-accent"
						}`}
					>
						{formatTime(timeLeft)}
					</span>
				</div>

				{/* Resend OTP */}
				<div className="text-center text-sm text-muted">
					Didn't receive the code?{" "}
					<button
						type="button"
						onClick={handleResendOTP}
						disabled={isLoading || timeLeft > 240}
						className="text-accent font-semibold hover:underline disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
					>
						Resend
					</button>
				</div>
			</div>

			<div className="flex gap-3 pt-4">
				<Button
					variant="primary"
					className="flex-1"
					onClick={handleBack}
					isDisabled={isLoading}
				>
					Back
				</Button>
				<Button
					className="flex-1 rounded"
					variant="primary"
					onClick={handleVerifyOTP}
					isDisabled={otp.length !== 6}
				>
					{isLoading ? "Verifying..." : "Verify"}
				</Button>
			</div>
		</div>
	);
};
