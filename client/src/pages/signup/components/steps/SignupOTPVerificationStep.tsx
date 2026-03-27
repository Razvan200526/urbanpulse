import { Button } from "@client/components/Button/Button";
import {
	type InputOTPRefType,
	InputOtp,
} from "@client/components/input/InputOtp";
import { H2 } from "@client/components/typography";
import { Separator, Toast } from "@heroui/react";
import { isOTPValid } from "@shared/validators/isOTPValid";
import { ChevronLeftIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { useVerifyOTP } from "../../hooks";
import { useSignupStore } from "../../signUpStore";
export const SignupOTPVerificationStep = () => {
	const { data, setStep, clear } = useSignupStore();
	const { mutateAsync: verifyOTP, isPending } = useVerifyOTP();

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

	const navigate = useNavigate();

	const handleVerifyOTP = async () => {
		const code = otpRef.current?.getValue() || "";

		if (!isOTPValid(code)) {
			Toast.toast.danger("Invalid OTP");
			return;
		}

		const res = await verifyOTP({
			email: data.email,
			otp: code,
		});

		if (res) {
			clear();
			navigate("/map");
		}
	};

	const handleBack = () => {
		setStep(2);
	};

	const handleResend = () => {
		setTimeLeft(300);
		console.log("Resending OTP...");
	}; //handle resending otp logic

	return (
		<div className="w-full max-w-md mx-auto flex flex-col gap-6">
			<div className="flex flex-col gap-2">
				<H2 className="text-2xl font-bold text-accent">Verify Your Email</H2>
				<p className="text-sm text-muted">
					We've sent a verification code to{" "}
					<span className="font-semibold text-accent">{data.email}</span>
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
				<div className="flex justify-center items-center gap-2 px-1">
					<span className="text-xs text-muted">Code expires in:</span>
					<span
						className={`text-xs font-mono font-bold ${timeLeft < 60 ? "text-danger" : "text-accent"}`}
					>
						{formatTime(timeLeft)}
					</span>
				</div>

				<div className="flex justify-between gap-3">
					<Button
						startContent={<ChevronLeftIcon className="size-4" />}
						onClick={handleBack}
						isDisabled={isPending}
					>
						Back
					</Button>
					<Button
						onClick={handleVerifyOTP}
						isPending={isPending}
						isDisabled={otpLength !== 6 || timeLeft === 0}
					>
						Verify
					</Button>
				</div>
			</div>
		</div>
	);
};
