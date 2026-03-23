import {
	cn,
	InputGroup,
	Label,
	TextField,
	type TextFieldProps,
} from "@heroui/react";
import { forwardRef, useImperativeHandle, useState } from "react";
import { SearchIcon } from "../icons/SearchIcon";

export type InputSearchRefType = {
	getValue: () => string;
	setValue: (s: string) => void;
};

type InputSearchProps = Omit<
	TextFieldProps,
	"type" | "value" | "defaultValue" | "ref"
> & {
	placeholder?: string;
	label?: string;
	required?: boolean;
	initialValue?: string;
	showIcon?: boolean;
};

export const InputSearch = forwardRef<InputSearchRefType, InputSearchProps>(
	(
		{
			label,
			required = false,
			placeholder = "Search...",
			name = "name",
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

		useImperativeHandle(
			ref,
			() => ({
				getValue: () => value,
				setValue: (s: string) => setValue(s),
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

				<InputGroup className="rounded border border-accent">
					{showIcon && (
						<InputGroup.Prefix>
							<SearchIcon
								className={cn("size-4", focused ? "text-accent" : "text-muted")}
							/>
						</InputGroup.Prefix>
					)}

					<InputGroup.Input
						className="text-primary-400"
						placeholder={placeholder}
					/>
					{/*
					<InputGroup.Suffix>
						<Button variant="primary" size="sm">
							Search
						</Button>
					</InputGroup.Suffix>*/}
				</InputGroup>
			</TextField>
		);
	},
);
