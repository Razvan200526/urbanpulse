import { ChevronRightIcon } from "@client/components/icons/ChevronRight";
import {
	InputEmail,
	type InputEmailRefType,
} from "@client/components/input/InputEmail";
import { Link } from "@client/components/Link";
import { Button, Separator } from "@heroui/react";
import { useRef } from "react";
import { useSignupStore } from "../../signUpStore";

export const SignupEmailStep = () => {
	const emailRef = useRef<InputEmailRefType>(null);
	const { data, setData, setStep } = useSignupStore();

	const handleNext = () => {
		if (emailRef.current?.validate()) {
			setData({
				...data,
				email: emailRef.current.getValue(),
			});
			setStep(1);
		}
	};

	return (
		<div className="h-fit flex flex-col gap-4">
			<InputEmail ref={emailRef} initialValue={data.email} />

			<div className="pt-4 flex items-center justify-end">
				<Button
					size="sm"
					className="rounded-sm"
					variant="primary"
					onClick={handleNext}
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
