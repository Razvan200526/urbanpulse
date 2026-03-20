import {
	type InputOTPRefType,
	InputOtp,
} from "@client/components/input/InputOtp";
import { Button, Separator, Toast } from "@heroui/react";
import { useEffect, useRef, useState } from "react";
import { useForgotPasswordStore } from "../../forgotPasswordStore";
import { useVerifyOtp } from "../../hooks";

export const ForgotPasswordOTPVerificationStep = () => {
	const { email, setStep, setOtp } = useForgotPasswordStore();
	const { mutateAsync: verifyOtp } = useVerifyOtp();
	const otpRef = useRef<InputOTPRefType | null>(null);

	const [timeLeft, setTimeLeft] = useState<number>(300);
	const [otpLength, setOtpLength] = useState(0);

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
		const code = otpRef.current?.getValue();
		if (!code || code.length !== 6) return;

		const res = await verifyOtp({ email, otp: code });
		if (res?.success) {
			Toast.toast.success("OTP verified successfully!");
			setOtp(code);
			setStep(2);
		}
	};

	const handleBack = () => {
		setStep(0);
	};

	const handleResend = () => {
		setTimeLeft(300);
		console.log("Resending OTP...");
	};

	return (
		<div className="w-full max-w-md mx-auto flex flex-col gap-6">
			<div className="flex flex-col gap-2">
				<h2 className="text-2xl font-bold text-(--foreground)">
					Verify Your Email
				</h2>
				<p className="text-sm text-muted">
					We've sent a verification code to{" "}
					<span className="font-semibold text-(--foreground)">{email}</span>
				</p>
			</div>

			<Separator />

			<InputOtp
				ref={otpRef}
				onResend={handleResend}
				onChange={(val) => setOtpLength(val.length)}
				onComplete={handleVerifyOTP}
			/>

			<div className="flex flex-col gap-4">
				<div className="flex justify-between items-center px-1">
					<span className="text-xs text-muted">Code expires in:</span>
					<span
						className={`text-xs font-mono font-bold ${timeLeft < 60 ? "text-danger" : "text-accent"}`}
					>
						{formatTime(timeLeft)}
					</span>
				</div>

				<div className="flex justify-between gap-3">
					<Button variant="outline" className="rounded-xl" onClick={handleBack}>
						Back
					</Button>
					<Button
						className="rounded-xl"
						variant="primary"
						onClick={handleVerifyOTP}
						isDisabled={otpLength !== 6 || timeLeft === 0}
					>
						Verify
					</Button>
				</div>
			</div>
		</div>
	);
};
