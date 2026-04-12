import { InputOTP, type InputOTPProps, Link, Surface } from "@heroui/react";
import { forwardRef, useImperativeHandle, useState } from "react";

export type InputOTPRefType = {
	getValue: () => string;
	setValue: (s: string) => void;
	isValid: () => boolean;
};

export interface MyInputOtpProps
	extends Omit<InputOTPProps, "maxLength" | "variant" | "value" | "children"> {
	onResend?: () => void;
}

export const InputOtp = forwardRef<InputOTPRefType, MyInputOtpProps>(
	(props, ref) => {
		const [value, setValue] = useState("");

		useImperativeHandle(
			ref,
			() => ({
				getValue: () => value,
				setValue: (s: string) => setValue(s),
				isValid: () => value.length === 6,
			}),
			[value],
		);

		return (
			<Surface className="flex w-full max-w-full flex-col items-stretch gap-3 rounded-lg p-4 sm:items-center sm:gap-2 sm:p-6">
				<InputOTP
					{...props}
					value={value}
					onChange={setValue}
					maxLength={6}
					variant="secondary"
					className="w-full"
				>
					<InputOTP.Group className="gap-2 sm:gap-3">
						<InputOTP.Slot
							className="size-10 rounded border text-base font-semibold sm:size-11"
							index={0}
						/>
						<InputOTP.Slot
							className="size-10 rounded border text-base font-semibold sm:size-11"
							index={1}
						/>
						<InputOTP.Slot
							className="size-10 rounded border text-base font-semibold sm:size-11"
							index={2}
						/>
					</InputOTP.Group>
					<InputOTP.Separator className="mx-1 h-1 w-2 rounded-full bg-border" />
					<InputOTP.Group className="gap-2 sm:gap-3">
						<InputOTP.Slot
							className="size-10 rounded border text-base font-semibold sm:size-11"
							index={3}
						/>
						<InputOTP.Slot
							className="size-10 rounded border text-base font-semibold sm:size-11"
							index={4}
						/>
						<InputOTP.Slot
							className="size-10 rounded border text-base font-semibold sm:size-11"
							index={5}
						/>
					</InputOTP.Group>
				</InputOTP>

				<div className="flex flex-wrap items-center justify-center gap-1.5 px-1 pt-1 text-center sm:text-left">
					<p className="text-sm text-muted">Didn&apos;t receive a code?</p>
					<Link
						className="text-foreground underline cursor-pointer"
						onPress={props.onResend}
					>
						Resend
					</Link>
				</div>
			</Surface>
		);
	},
);
