import { Button } from "@client/components/Button/Button";
import { ChevronRightIcon } from "@client/components/icons/ChevronRight";
import {
	InputEmail,
	type InputEmailRefType,
} from "@client/components/input/InputEmail";
import { H3 } from "@client/components/typography";
import { useRef } from "react";
import { useForgotPasswordStore } from "../../forgotPasswordStore";
import { useSendForgotPassowrdOtp } from "../../hooks";

export const ForgotPasswordEmailStep = () => {
	const emailRef = useRef<InputEmailRefType | null>(null);
	const { email, setEmail, setStep } = useForgotPasswordStore();
	const { mutateAsync: sendOtp, isPending } = useSendForgotPassowrdOtp();
	const handleNext = async () => {
		const isEmailValid = emailRef.current?.validate();
		if (!isEmailValid) return;

		const currentEmail = emailRef.current?.getValue() || "";
		const res = await sendOtp({ email: currentEmail });
		if (res?.success) {
			setEmail(currentEmail);
			setStep(1);
		}
	};

	return (
		<div className="h-fit flex flex-col gap-4">
			<div className="flex-col space-y-2">
				<H3>Forgot your password?</H3>
				<p className="text-muted font-normal">
					No worries, we are here to help!
				</p>
			</div>
			<InputEmail ref={emailRef} initialValue={email} />

			<div className="pt-4 flex items-center justify-end">
				<Button
					size="sm"
					variant="primary"
					isPending={isPending}
					onClick={handleNext}
				>
					<p className="font-semibold">Next</p>
					<ChevronRightIcon className="size-3.5" />
				</Button>
			</div>
		</div>
	);
};
