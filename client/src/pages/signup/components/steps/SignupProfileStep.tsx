import { H1 } from "@client/components/typography";
import { Button, Input, Separator } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useRef, useState } from "react";
import { useSignupStore } from "../../signUpStore";

export const SignupProfileStep = () => {
	const { data, setData, setStep } = useSignupStore();
	const firstNameRef = useRef<HTMLInputElement>(null);
	const lastNameRef = useRef<HTMLInputElement>(null);
	const bioRef = useRef<HTMLTextAreaElement>(null);
	const [imagePreview, setImagePreview] = useState<string>(data.image);

	const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			const reader = new FileReader();
			reader.onloadend = () => {
				const result = reader.result as string;
				setImagePreview(result);
			};
			reader.readAsDataURL(file);
		}
	};

	const handleNext = () => {
		const firstName = firstNameRef.current?.value?.trim();
		const lastName = lastNameRef.current?.value?.trim();
		const bio = bioRef.current?.value?.trim();

		if (!firstName || !lastName) {
			console.error("First name and last name are required");
			return;
		}

		setData({
			...data,
			firstName,
			lastName,
			bio: bio || "",
			image: imagePreview,
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
				{/* Profile Image */}
				<div className="flex flex-col gap-3">
					<H1 className="text-accent font-semibold">Profile Picture</H1>
					<div className="flex flex-col gap-3 items-center">
						{imagePreview ? (
							<img
								src={imagePreview}
								alt="Profile preview"
								className="w-24 h-24 rounded-full object-cover border-2 border-border"
							/>
						) : (
							<div className="w-24 h-24 rounded-full bg-surface border-2 border-border flex items-center justify-center">
								<Icon icon="gravity-ui:image" className="text-3xl text-muted" />
							</div>
						)}
						<input
							type="file"
							accept="image/*"
							onChange={handleImageUpload}
							className="hidden"
							id="image-input"
						/>
						<label
							htmlFor="image-input"
							className="cursor-pointer text-accent text-sm font-medium hover:underline"
						>
							Change Picture
						</label>
					</div>
				</div>

				{/* First Name */}
				<Input
					ref={firstNameRef}
					type="text"
					placeholder="John"
					defaultValue={data.firstName}
				/>

				{/* Last Name */}
				<Input
					ref={lastNameRef}
					type="text"
					placeholder="Doe"
					defaultValue={data.lastName}
					maxLength={30}
				/>
			</div>

			<div className="flex gap-3 pt-4">
				<Button variant="primary" className="flex-1" onClick={handleBack}>
					Back
				</Button>
				<Button
					className="flex-1 rounded"
					variant="primary"
					onClick={handleNext}
				>
					Next
				</Button>
			</div>
		</div>
	);
};
