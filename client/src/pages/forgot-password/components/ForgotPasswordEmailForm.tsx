import { ChevronRightIcon } from "@client/components/icons/ChevronRight";
import {
	InputEmail,
	type InputEmailRefType,
} from "@client/components/input/InputEmail";
import { H3 } from "@client/components/typography";
import { Button } from "@heroui/react";
import { useRef } from "react";

export const ForgotPasswordEmailForm = () => {
	const emailRef = useRef<InputEmailRefType | null>(null);

	return (
		<div className="h-fit flex flex-col gap-4">
			<div className="flex-col space-y-2">
				<H3>Forgot your password?</H3>
				<p className="text-muted font-normal">
					No worries, we are here to help!
				</p>
			</div>
			<InputEmail ref={emailRef} initialValue={""} />

			<div className="pt-4 flex items-center justify-end">
				<Button size="sm" variant="primary">
					<p className="font-semibold">Next</p>
					<ChevronRightIcon className="size-3.5" />
				</Button>
			</div>
		</div>
	);
};
