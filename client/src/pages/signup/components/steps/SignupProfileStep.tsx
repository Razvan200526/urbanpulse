import { Button } from "@client/components/Button/Button";
import { InputAvatar } from "@client/components/input/InputAvatar";
import {
	InputName,
	type InputNameRefType,
} from "@client/components/input/InputName";
import { TextArea, type TextAreaRefType } from "@client/components/TextArea";
import { H2 } from "@client/components/typography";
import { Separator, Toast } from "@heroui/react";
import { isBioValid } from "@shared/validators/isBioValid";
import { signUpNameSchema } from "@shared/validators/isSignUpInfoValid";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useRef } from "react";
import { useSignUp } from "../../hooks";
import { buildSignUpPayload } from "../../signUpPayload";
import { useSignupStore } from "../../signUpStore";

export const SignupProfileStep = () => {
	const { data, setData, setStep } = useSignupStore();
	const { mutateAsync: signUp, isPending } = useSignUp();
	const nameRef = useRef<InputNameRefType | null>(null);
	const bioRef = useRef<TextAreaRefType | null>(null);

	const handleNext = async () => {
		const nextData = buildSignUpPayload({
			...data,
			name: nameRef.current?.getValue() || "",
			bio: bioRef.current?.getValue() || "",
		});

		if (
			!signUpNameSchema.safeParse(nextData.name).success ||
			!isBioValid(nextData.bio)
		) {
			Toast.toast.danger("Invalid name or bio");
			return;
		}

		setData(nextData);

		const createdUser = await signUp(nextData);
		if (!createdUser) {
			return;
		}

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
					initialValue={data.name}
					onChange={(e) => {
						nameRef.current?.setValue(e);
					}}
					placeholder="John"
				/>
				<TextArea
					inputWrapperClassname="h-32"
					inputMode="text"
					initialValue={data.bio}
					label="Bio"
					placeholder="Bio..."
					maxLength={100}
					required={false}
					ref={bioRef}
					onChange={(e) => {
						bioRef.current?.setValue(e.target.value);
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
