import { ChevronRightIcon } from "@client/components/icons/ChevronRight";
import { InputAvatar } from "@client/components/input/InputAvatar";
import {
	InputName,
	type InputNameRefType,
} from "@client/components/input/InputName";
import { TextArea, type TextAreaRefType } from "@client/components/TextArea";
import { Button, Separator, Toast } from "@heroui/react";
import { isSignUpInfoValid } from "@shared/validators/isSignUpInfoValid";
import { useRef } from "react";
import { useSignUp } from "../../hooks";
import { useSignupStore } from "../../signUpStore";

export const SignupProfileStep = () => {
	const { data, setData, setStep } = useSignupStore();
	const { mutateAsync: signUp, isError, isPending } = useSignUp();
	const nameRef = useRef<InputNameRefType>(null);
	const bioRef = useRef<TextAreaRefType | null>(null);

	const handleNext = async () => {
		const name = nameRef.current?.getValue() || "";
		const bio = bioRef.current?.getValue() || "";

		const updatedData = {
			...data,
			name,
			bio,
		};
		setData(updatedData);

		if (!isSignUpInfoValid(updatedData)) {
			console.error("Name is required");
			return;
		}

		const newUser = await signUp(updatedData);
		if (newUser.error || isError) {
			Toast.toast.danger("Sign up failed,try again later");
			return;
		}

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
					variant="primary"
					className="flex justify-start"
					onClick={handleBack}
				>
					Back
				</Button>
				<Button
					className="flex rounded"
					variant="primary"
					onClick={handleNext}
					isPending={isPending}
					isDisabled={isPending}
				>
					Sign Up
					<ChevronRightIcon />
				</Button>
			</div>
		</div>
	);
};
