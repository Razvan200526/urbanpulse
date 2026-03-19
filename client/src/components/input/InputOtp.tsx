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
			<Surface className="flex w-full flex-col items-center gap-2 rounded-3xl p-6">
				<InputOTP
					{...props}
					value={value}
					onChange={setValue}
					maxLength={6}
					variant="secondary"
				>
					<InputOTP.Group>
						<InputOTP.Slot index={0} />
						<InputOTP.Slot index={1} />
						<InputOTP.Slot index={2} />
					</InputOTP.Group>
					<InputOTP.Separator />
					<InputOTP.Group>
						<InputOTP.Slot index={3} />
						<InputOTP.Slot index={4} />
						<InputOTP.Slot index={5} />
					</InputOTP.Group>
				</InputOTP>

				<div className="flex items-center gap-1.25 px-1 pt-1">
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
