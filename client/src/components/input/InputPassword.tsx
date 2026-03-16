import {
	Button,
	cn,
	InputGroup,
	Label,
	TextField,
	type TextFieldProps,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { forwardRef, useImperativeHandle, useMemo, useState } from "react";
import { EyeClosedIcon } from "../icons/EyeClosedIcon";
import { EyeOpenIcon } from "../icons/EyeOpenIcon";
import { PasswordIcon } from "../icons/PasswordIcon";

export type InputPasswordRefType = {
	getValue: () => string;
	setValue: (s: string) => void;
	getErrorMessage: () => string;
	isValid: () => boolean;
	validate: () => boolean;
};

type InputPasswordProps = Omit<
	TextFieldProps,
	"type" | "value" | "defaultValue" | "ref"
> & {
	placeholder?: string;
	label?: string;
	required?: boolean;
	initialValue?: string;
	showIcon?: boolean;
	minLength?: number;
};

const validatePassword = (password: string, minLength: number = 8): string => {
	if (!password.trim()) {
		return "Password is required";
	}
	if (password.length < minLength) {
		return `Password must be at least ${minLength} characters`;
	}
	return "";
};

export const InputPassword = forwardRef<
	InputPasswordRefType,
	InputPasswordProps
>(
	(
		{
			label = "Password",
			required = true,
			placeholder = "Enter your password",
			name = "password",
			initialValue = "",
			showIcon = true,
			minLength = 8,
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
		const [showPassword, setShowPassword] = useState(false);

		const errorMessage = useMemo(() => {
			return validatePassword(value, minLength);
		}, [value, minLength]);

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
				type={showPassword ? "text" : "password"}
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
							<PasswordIcon
								className={cn("size-4", focused ? "text-accent" : "text-muted")}
							/>
						</InputGroup.Prefix>
					)}

					<InputGroup.Input
						className="text-primary-400"
						placeholder={placeholder}
					/>

					<InputGroup.Suffix className="flex items-center gap-2">
						<Button
							isIconOnly
							size="sm"
							variant="ghost"
							onClick={() => setShowPassword(!showPassword)}
							className="rounded-full text-muted hover:text-accent transition-colors"
						>
							{showPassword ? (
								<EyeOpenIcon className="size-3.5" />
							) : (
								<EyeClosedIcon className="size-3.5" />
							)}
						</Button>

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

InputPassword.displayName = "InputPassword";
