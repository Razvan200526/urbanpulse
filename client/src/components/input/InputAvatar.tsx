import { Avatar } from "@heroui/react";
import { useId, useRef, useState } from "react";
import { ImageCropper } from "../ImageCropper";
import { UserIcon } from "../icons/UserIcon";
import type { ModalRefType } from "../Modal";

export type InputAvatarPropsType = {
	value?: string;
	onAvatarChange?: (url: string) => void;
};

export const InputAvatar = ({
	value,
	onAvatarChange,
}: InputAvatarPropsType) => {
	const id = useId();
	const cropperModalRef = useRef<ModalRefType | null>(null);
	const [avatarUrl, setAvatarUrl] = useState<string | undefined>(value);
	const [imageToCrop, setImageToCrop] = useState<string | undefined>(undefined);

	const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (file) {
			const allowedFormats = [
				"image/jpeg",
				"image/jpg",
				"image/png",
				"image/webp",
			];
			if (!allowedFormats.includes(file.type)) {
				event.target.value = "";
				return;
			}
			const reader = new FileReader();
			reader.onload = (e) => {
				setImageToCrop(e.target?.result as string);
				event.target.value = "";
			};
			reader.readAsDataURL(file);
		}
	};

	return (
		<>
			<label
				htmlFor={id}
				className="flex h-24 w-24 max-w-full items-center justify-center sm:h-30 sm:w-30"
			>
				<Avatar
					className="group h-full w-full cursor-pointer transition-colors duration-150 ease-in hover:border-2 hover:border-accent"
					variant="soft"
				>
					{!imageToCrop && (
						<Avatar.Fallback>
							<UserIcon className="size-12 text-muted group-hover:text-accent transition-colors duration-150 ease-in" />
						</Avatar.Fallback>
					)}
					<Avatar.Image src={avatarUrl} />
				</Avatar>
				<input
					id={id}
					type="file"
					accept=".jpg,.jpeg,.png,.webp"
					onChange={handleFileChange}
					className="hidden"
				/>
			</label>
			{imageToCrop ? (
				<ImageCropper
					image={imageToCrop}
					modalRef={cropperModalRef}
					onClose={() => setImageToCrop(undefined)}
					onSave={(url: string) => {
						setAvatarUrl(url);
						setImageToCrop(undefined);
						onAvatarChange?.(url);
					}}
				/>
			) : null}
		</>
	);
};
