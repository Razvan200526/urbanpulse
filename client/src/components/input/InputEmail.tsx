import {
	cn,
	InputGroup,
	Label,
	TextField,
	type TextFieldProps,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { isEmailValid } from "@shared/validators/isEmailValid";
import { forwardRef, useImperativeHandle, useMemo, useState } from "react";
import { EmailIcon } from "../icons/EmailIcon";

export type InputEmailRefType = {
	getValue: () => string;
	setValue: (s: string) => void;
	getErrorMessage: () => string;
	isValid: () => boolean;
	validate: () => boolean;
};

type InputEmailProps = Omit<
	TextFieldProps,
	"type" | "value" | "defaultValue" | "ref"
> & {
	placeholder?: string;
	label?: string;
	required?: boolean;
	initialValue?: string;
	showIcon?: boolean;
};

export const InputEmail = forwardRef<InputEmailRefType, InputEmailProps>(
	(
		{
			label = "Email",
			required = true,
			placeholder = "name@email.com",
			name = "email",
			initialValue = "",
			showIcon = true,
			onChange,
			onBlur,
			onFocus,
			className,
			...rest
		},
		ref,
	) => {
		const [value, setValue] = useState<string>(initialValue);
		const [focused, setFocused] = useState(false);
		const [submitted, setSubmitted] = useState(false);

		const errorMessage = useMemo(() => {
			if (!value.trim()) {
				return "Email is required";
			}
			if (!isEmailValid(value)) {
				return "Please enter a valid email address";
			}
			return "";
		}, [value]);

		const isInvalid = submitted && !!errorMessage;
		const isValid = submitted && !errorMessage && value.trim() !== "";

		useImperativeHandle(
			ref,
			() => ({
				getValue: () => value,
				setValue: (s: string) => setValue(s),
				getErrorMessage: () => errorMessage,
				isValid: () => !errorMessage,
				validate: () => {
					setSubmitted(true);
					return !errorMessage;
				},
			}),
			[value, errorMessage],
		);

		return (
			<TextField
				{...rest}
				type="email"
				name={name}
				value={value}
				isRequired={required}
				isInvalid={isInvalid}
				className={className}
				onFocus={(e) => {
					setFocused(true);
					onFocus?.(e);
				}}
				onBlur={(e) => {
					setFocused(false);
					onBlur?.(e);
				}}
				onChange={(e) => {
					setValue(e);
					onChange?.(e);
				}}
			>
				{label && <Label className="text-accent font-semibold">{label}</Label>}

				<InputGroup className="rounded border border-primary">
					{showIcon && (
						<InputGroup.Prefix>
							<EmailIcon
								className={cn("size-4", focused ? "text-accent" : "text-muted")}
							/>
						</InputGroup.Prefix>
					)}

					<InputGroup.Input
						className="text-primary-400"
						placeholder={placeholder}
					/>

					<InputGroup.Suffix>
						{isValid && (
							<Icon icon="gravity-ui:check" className="text-success text-lg" />
						)}
						{isInvalid && (
							<Icon
								icon="gravity-ui:circle-xmark"
								className="text-danger text-lg"
							/>
						)}
					</InputGroup.Suffix>
				</InputGroup>
			</TextField>
		);
	},
);

InputEmail.displayName = "InputEmail";
