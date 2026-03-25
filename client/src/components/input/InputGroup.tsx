import {
	cn,
	InputGroup as HeroInputGroup,
	type InputGroupProps,
} from "@heroui/react";

export const InputGroup = (props: InputGroupProps) => {
	return (
		<HeroInputGroup
			{...props}
			className={cn(props.className, "focus-within:bg-surface")}
		/>
	);
};
