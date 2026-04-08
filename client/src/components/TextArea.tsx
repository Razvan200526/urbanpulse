import {
	cn,
	TextArea as HeroTextArea,
	Label,
	type TextAreaProps,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { forwardRef, useImperativeHandle, useMemo, useState } from "react";

export type TextAreaRefType = {
	getValue: () => string;
	setValue: (s: string) => void;
	getErrorMessage: () => string;
	isValid: () => boolean;
	validate: () => boolean;
};

type TextAreaComponentProps = Omit<
	TextAreaProps,
	"value" | "defaultValue" | "ref"
> & {
	label?: string;
	required?: boolean;
	initialValue?: string;
	showIcon?: boolean;
	minRows?: number;
	maxRows?: number;
	maxLength?: number;
	placeholder?: string;
	inputWrapperClassname?: string; //basically the container of the textarea not the outer div classname
};

export const TextArea = forwardRef<TextAreaRefType, TextAreaComponentProps>(
	(
		{
			label = "Message",
			required = true,
			placeholder = "Your message...",
			name = "message",
			initialValue = "",
			showIcon = true,
			minRows = 4,
			maxRows = 8,
			maxLength,
			onChange,
			onBlur,
			onFocus,
			className,
			inputWrapperClassname,
			...rest
		},
		ref,
	) => {
		const [value, setValue] = useState<string>(initialValue);
		const [_focused, setFocused] = useState(false);
		const [submitted, setSubmitted] = useState(false);

		const errorMessage = useMemo(() => {
			if (!value.trim()) {
				return "This field is required";
			}
			if (maxLength && value.length > maxLength) {
				return `Must be less than ${maxLength} characters`;
			}
			return "";
		}, [value, maxLength]);

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

		const charCount = maxLength ? `${value.length}/${maxLength}` : undefined;

		return (
			<div className={cn("flex flex-col gap-1.5", className)}>
				{label && (
					<Label className="text-accent font-semibold text-sm">
						{label}
						{required && <span className="text-danger ml-1">*</span>}
					</Label>
				)}

				<HeroTextArea
					{...rest}
					name={name}
					value={value}
					className={cn(
						"rounded border border-accent text-primary-400 placeholder:italic focus-within:bg-surface",
						inputWrapperClassname,
					)}
					placeholder={placeholder}
					onFocus={(e) => {
						setFocused(true);
						onFocus?.(e);
					}}
					onBlur={(e) => {
						setFocused(false);
						onBlur?.(e);
					}}
					onChange={(e) => {
						setValue(e.target.value);
						onChange?.(e);
					}}
				/>

				<div className="shrink-0">
					{isValid && (
						<Icon icon="gravity-ui:check" className="text-success text-lg" />
					)}
					{isInvalid && (
						<Icon
							icon="gravity-ui:circle-xmark"
							className="text-danger text-lg"
						/>
					)}
				</div>

				{isInvalid && (
					<span className="text-xs text-danger">{errorMessage}</span>
				)}

				{maxLength && (
					<span
						className={cn(
							"text-xs text-right",
							value.length >= maxLength * 0.9 ? "text-danger" : "text-muted",
						)}
					>
						{charCount}
					</span>
				)}
			</div>
		);
	},
);
