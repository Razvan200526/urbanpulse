import {
	cn,
	InputGroup as HeroInputGroup,
	type InputGroupProps,
} from "@heroui/react";

export const InputGroup = (props: InputGroupProps) => {
	return (
		<HeroInputGroup
			{...props}
			fullWidth={props.fullWidth ?? true}
			className={cn("w-full focus-within:bg-surface", props.className)}
		/>
	);
};
