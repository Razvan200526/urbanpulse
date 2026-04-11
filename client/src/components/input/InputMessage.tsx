import { cn, InputGroup, TextField, type TextFieldProps } from "@heroui/react";
import { MessageSquare, SendIcon } from "lucide-react";
import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { Button } from "../Button/Button";

export type InputMessageRefType = {
	getValue: () => string;
	setValue: (s: string) => void;
};

type InputNameProps = Omit<
	TextFieldProps,
	"type" | "value" | "defaultValue" | "ref"
> & {
	placeholder?: string;
	label?: string;
	required?: boolean;
	initialValue?: string;
	value?: string;
	showIcon?: boolean;
	sendMessage: (message: string) => Promise<void>;
};

export const InputMessage = forwardRef<InputMessageRefType, InputNameProps>(
	(
		{
			label = "Message",
			required = true,
			placeholder = "Say hello...",
			name = "name",
			initialValue = "",
			value: controlledValue,
			showIcon = true,
			onChange,
			onBlur,
			onFocus,
			sendMessage,
			className,
			isDisabled,
			...rest
		},
		ref,
	) => {
		const [value, setValue] = useState<string>(initialValue);
		const [focused, setFocused] = useState(false);

		useEffect(() => {
			if (controlledValue !== undefined) {
				setValue(controlledValue);
			}
		}, [controlledValue]);

		useImperativeHandle(
			ref,
			() => ({
				getValue: () => value,
				setValue: (s: string) => {
					setValue(s);
				},
			}),
			[value],
		);

		return (
			<TextField
				{...rest}
				type="text"
				name={name}
				value={value}
				isRequired={required}
				isDisabled={isDisabled}
				isInvalid={false}
				className={cn(className)}
				onKeyDown={(e) => {
					if (e.key === "Enter" && !e.shiftKey) {
						e.preventDefault();
						if (!value.trim()) {
							return;
						}

						void sendMessage(value);
					}
				}}
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
				<InputGroup
					aria-label="input-message"
					className="border border-accent focus-within:bg-surface rounded-full"
				>
					{showIcon && (
						<InputGroup.Prefix>
							<MessageSquare
								className={cn(
									"size-4",
									focused ? "text-accent" : "text-primary-300",
								)}
							/>
						</InputGroup.Prefix>
					)}

					<InputGroup.Input
						className="text-primary-400 placeholder:italic"
						placeholder={placeholder}
					/>

					<InputGroup.Suffix>
						<Button
							variant="ghost"
							isIconOnly
							aria-label="Send message"
							isDisabled={isDisabled || !value.trim()}
							startContent={
								<SendIcon
									className={cn(
										"size-4",
										value.trim() !== "" ? "text-accent" : "text-muted",
									)}
								/>
							}
							onPress={async () => {
								if (!value.trim()) {
									return;
								}

								await sendMessage(value);
								setValue("");
							}}
						/>
					</InputGroup.Suffix>
				</InputGroup>
			</TextField>
		);
	},
);
