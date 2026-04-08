import {
	InputName,
	type InputNameRefType,
} from "@client/components/input/InputName";
import { TextArea, type TextAreaRefType } from "@client/components/TextArea";

export const ProfileDetailsFields = ({
	name,
	bio,
	nameRef,
	bioRef,
	onNameChange,
	onBioChange,
}: {
	name: string;
	bio: string;
	nameRef: React.RefObject<InputNameRefType | null>;
	bioRef: React.RefObject<TextAreaRefType | null>;
	onNameChange: (value: string) => void;
	onBioChange: (value: string) => void;
}) => {
	return (
		<div className="grid gap-4 border-t border-border pt-6">
			<div className="space-y-2">
				<InputName
					ref={nameRef}
					label="Display name"
					initialValue={name}
					showIcon={false}
					required={false}
					onChange={onNameChange}
					placeholder="Your name"
				/>
			</div>
			<div className="space-y-2">
				<TextArea
					ref={bioRef}
					label="Bio"
					initialValue={bio}
					required={false}
					showIcon={false}
					minRows={5}
					maxRows={8}
					onChange={(event) => onBioChange(event.target.value)}
					inputWrapperClassname="min-h-40 rounded border-border bg-field-background px-3 py-3 text-sm text-field-foreground"
					placeholder="Tell neighbours how you like to help."
				/>
			</div>
		</div>
	);
};
