import { Avatar } from "@heroui/react";
import { useId, useState } from "react";
import { ImageCropper } from "../ImageCropper";
import { UserIcon } from "lucide-react";

export type InputAvatarPropsType = {
	value?: string;
	onAvatarChange?: (url: string) => void;
};

export const InputAvatar = ({
	value,
	onAvatarChange,
}: InputAvatarPropsType) => {
	const id = useId();
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
				className="flex h-30 w-30 items-center justify-center"
			>
				<Avatar
					className="w-full h-full hover:border-2 hover:border-accent transition-colors duration-150 ease-in cursor-pointer"
					variant="soft"
				>
					{!imageToCrop && (
						<Avatar.Fallback>
							<UserIcon className="size-12 text-accent" />
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
