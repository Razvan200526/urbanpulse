import { Button, Separator } from "@heroui/react";
import { useRef } from "react";
import { useSignupStore } from "../../signUpStore";
import {
	InputName,
	type InputNameRefType,
} from "@client/components/input/InputName";
import { ChevronRightIcon } from "@client/components/icons/ChevronRight";
import { TextArea } from "@client/components/TextArea";
import { InputAvatar } from "@client/components/input/InputAvatar";

export const SignupProfileStep = () => {
	const { data, setData, setStep } = useSignupStore();
	const nameRef = useRef<InputNameRefType>(null);
	const bioRef = useRef<HTMLTextAreaElement>(null);

	const handleNext = () => {
		const name = nameRef.current?.getValue();
		const bio = bioRef.current?.value?.trim();

		if (!name) {
			console.error("Name is required");
			return;
		}

		setData({
			...data,
			name,
			bio: bio || "",
		});

		setStep(3);
	};

	const handleBack = () => {
		setStep(1);
	};

	return (
		<div className="w-full max-w-md mx-auto flex flex-col gap-6">
			<div className="flex flex-col gap-2">
				<h2 className="text-2xl font-bold text-(--foreground)">
					Complete Your Profile
				</h2>
				<p className="text-sm text-muted">Tell us a bit about yourself</p>
			</div>

			<Separator />

			<div className="flex flex-col gap-4">
				<div className="flex items-center justify-center">
					<InputAvatar
						value={data.image}
						onAvatarChange={(url) => setData({ ...data, image: url })}
					/>
				</div>
				<InputName ref={nameRef} placeholder="John" />
				<TextArea
					inputWrapperClassname="h-32"
					inputMode="text"
					label="Bio"
					placeholder="Bio..."
					maxLength={100}
				/>
			</div>

			<div className="flex gap-3 pt-4 justify-between">
				<Button
					variant="primary"
					className="flex justify-start"
					onClick={handleBack}
				>
					Back
				</Button>
				<Button className="flex rounded" variant="primary" onClick={handleNext}>
					Next
					<ChevronRightIcon />
				</Button>
			</div>
		</div>
	);
};
