import { InputAvatar } from "@client/components/input/InputAvatar";
import {
	InputName,
	type InputNameRefType,
} from "@client/components/input/InputName";
import { TextArea, type TextAreaRefType } from "@client/components/TextArea";
import { Separator, Toast } from "@heroui/react";
import { useRef } from "react";
import { useSignUp } from "../../hooks";
import { useSignupStore } from "../../signUpStore";
import { H2 } from "@client/components/typography";
import { Button } from "@client/components/Button/Button";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { isNameValid } from "@shared/validators/isNameValid";
import { isBioValid } from "@shared/validators/isBioValid";

export const SignupProfileStep = () => {
	const { data, setData, setStep } = useSignupStore();
	const { mutateAsync: signUp, isPending } = useSignUp();
	const nameRef = useRef<InputNameRefType | null>(null);
	const bioRef = useRef<TextAreaRefType | null>(null);

	const handleNext = async () => {
		const name = nameRef.current?.getValue() || "";
		const bio = bioRef.current?.getValue() || "";

		if (!isNameValid(name) || !isBioValid(bio)) {
			Toast.toast.danger("Invalid name or bio");
			return;
		}

		setData({
			...data,
			name,
			bio,
		});

		await signUp(data);

		setStep(3);
	};

	const handleBack = () => {
		setStep(1);
	};

	return (
		<div className="w-full max-w-md mx-auto flex flex-col gap-4">
			<div className="flex flex-col">
				<H2>Complete Your Profile</H2>
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
				<InputName
					ref={nameRef}
					onChange={(e) => {
						nameRef.current?.setValue(e);
						console.log(e);
					}}
					placeholder="John"
				/>
				<TextArea
					inputWrapperClassname="h-32"
					inputMode="text"
					label="Bio"
					placeholder="Bio..."
					maxLength={100}
					ref={bioRef}
					onChange={(e) => {
						bioRef.current?.setValue(e.target.value);
						console.log(e.target.value);
					}}
				/>
			</div>

			<div className="flex gap-3 pt-4 justify-between">
				<Button
					startContent={<ChevronLeftIcon className="size-4" />}
					onPress={() => handleBack()}
				>
					Back
				</Button>
				<Button
					endContent={<ChevronRightIcon className="size-4" />}
					onClick={handleNext}
					isPending={isPending}
				>
					Create Account
				</Button>
			</div>
		</div>
	);
};
