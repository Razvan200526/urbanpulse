import { ChevronRightIcon } from "@client/components/icons/ChevronRight";
import {
	InputEmail,
	type InputEmailRefType,
} from "@client/components/input/InputEmail";
import { Link } from "@client/components/Link";
import { Button, Separator, Toast } from "@heroui/react";
import { useRef } from "react";
import { useSignupStore } from "../../signUpStore";
import { useVerifyEmail } from "../hooks";

export const SignupEmailStep = () => {
	const emailRef = useRef<InputEmailRefType>(null);
	const { data, setData, setStep } = useSignupStore();
	const { mutateAsync: verifyEmail, isPending } = useVerifyEmail();

	const handleNext = async () => {
		const email = emailRef.current?.getValue();
		if (email && emailRef.current?.validate()) {
			setData({
				...data,
				email,
			});

			try {
				const userExists = await verifyEmail(email);
				if (userExists?.exists) {
					Toast.toast.danger("Email already exists!");
					return;
				} else {
					setStep(1);
				}
			} catch (error) {
				Toast.toast.danger("Failed to verify email");
				console.error(error);
			}
		}
	};

	return (
		<div className="h-fit flex flex-col gap-4">
			<InputEmail ref={emailRef} initialValue={data.email} />

			<div className="pt-4 flex items-center justify-end">
				<Button
					size="sm"
					variant="primary"
					onClick={handleNext}
					isPending={isPending}
				>
					<p className="font-semibold">Next</p>
					<ChevronRightIcon className="size-3.5" />
				</Button>
			</div>

			<Separator />
			<div className="p-4 flex items-center justify-center gap-2">
				<p className="text-sm font-semibold text-foreground">
					Already have an account?
				</p>
				<Link to="/signin" className="text-sm">
					Sign In
				</Link>
			</div>
		</div>
	);
};
