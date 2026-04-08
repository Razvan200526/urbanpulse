import { Button } from "@client/components/Button/Button";
import { ChevronRightIcon } from "@client/components/icons/ChevronRight";
import {
	InputEmail,
	type InputEmailRefType,
} from "@client/components/input/InputEmail";
import { Link } from "@client/components/Link";
import { Separator } from "@heroui/react";
import { isEmailValid } from "@shared/validators/isEmailValid";
import { useRef } from "react";
import { useVerifyEmail } from "../../hooks";
import { useSignupStore } from "../../signUpStore";

export const SignupEmailStep = () => {
	const emailRef = useRef<InputEmailRefType>(null);
	const { data, setData, setStep } = useSignupStore();
	const { mutateAsync: verifyEmail, isPending } = useVerifyEmail();

	const handleNext = async () => {
		const email = emailRef.current?.getValue() || "";
		if (isEmailValid(email)) {
			setData({
				...data,
				email,
			});

			const isNewUser = await verifyEmail(email);
			if (isNewUser) {
				setStep(1);
			}
		}
	};

	return (
		<div className="h-fit flex flex-col gap-4">
			<InputEmail
				ref={emailRef}
				initialValue={data.email}
				placeholder="example@gmail.com"
			/>

			<div className="pt-2 flex items-center justify-end">
				<Button
					variant="primary"
					size="sm"
					onPress={() => handleNext()}
					isPending={isPending}
					endContent={<ChevronRightIcon className="size-4" />}
				>
					Next
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
