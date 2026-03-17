import { Button, Toast } from "@heroui/react";
import { useRef, useState } from "react";
import ReactCrop, { type Crop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { Modal } from "./Modal";
import { dataURLtoFile } from "@shared/utils/index";
import { PlusSquareIcon } from "lucide-react";
import { H4 } from "./typography";
import { useUploadAvatar, useUploadImage } from "@client/hooks/uploadHooks";

export type ImageCropperPropsType = {
	image: string;
	onClose: () => void;
	onSave: (url: string) => void;
	type?: "avatar" | "cover" | "image";
};

export const ImageCropper = ({
	image,
	onClose,
	onSave,
	type = "avatar",
}: ImageCropperPropsType) => {
	const { mutateAsync: uploadAvatar } = useUploadAvatar();
	const { mutateAsync: uploadImage } = useUploadImage();
	const imgRef = useRef<HTMLImageElement>(null);
	const [crop, setCrop] = useState<Crop>({
		unit: "px",
		x: 0,
		y: 0,
		width: type === "avatar" ? 325 : 600,
		height: type === "avatar" ? 325 : 128,
	});

	const [isOpen, setIsOpen] = useState(true);
	const [isLoading, setIsLoading] = useState(false);

	const isAvatar = type === "avatar";
	const isImage = type === "image";

	const getCroppedImg = (
		image: HTMLImageElement,
		crop: Crop,
	): Promise<string> => {
		return new Promise((resolve) => {
			const canvas = document.createElement("canvas");
			const ctx = canvas.getContext("2d");

			if (!ctx) {
				resolve("");
				return;
			}

			const scaleX = image.naturalWidth / image.width;
			const scaleY = image.naturalHeight / image.height;
			const pixelRatio = window.devicePixelRatio;

			canvas.width = crop.width * pixelRatio * scaleX;
			canvas.height = crop.height * pixelRatio * scaleY;

			ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
			ctx.imageSmoothingQuality = "high";

			ctx.drawImage(
				image,
				crop.x * scaleX,
				crop.y * scaleY,
				crop.width * scaleX,
				crop.height * scaleY,
				0,
				0,
				crop.width * scaleX,
				crop.height * scaleY,
			);

			canvas.toBlob(
				(blob) => {
					if (blob) {
						const reader = new FileReader();
						reader.onload = () => resolve(reader.result as string);
						reader.readAsDataURL(blob);
					} else {
						resolve("");
					}
				},
				"image/jpeg",
				0.9,
			);
		});
	};

	const onCropSave = async () => {
		if (imgRef.current && crop.width && crop.height) {
			const croppedImage = await getCroppedImg(imgRef.current, crop);
			const file = dataURLtoFile(croppedImage, `${type}.jpg`);
			setIsLoading(true);
			const response = isAvatar
				? await uploadAvatar(file)
				: await uploadImage(file);
			setIsLoading(false);

			const res = await response.json();
			if (!res.data.success) {
				Toast.toast.danger(res.data.message);
				return;
			}

			Toast.toast.success("Image uploaded successfully");
			onSave(res.data.url);
			setIsOpen(false);
		}
	};

	const footer = (
		<>
			<Button
				variant="danger-soft"
				onPress={() => {
					setIsOpen(false);
					onClose();
				}}
				isDisabled={isLoading}
			>
				Cancel
			</Button>
			<Button
				variant="primary"
				onPress={() => onCropSave()}
				isPending={isLoading}
			>
				Save
			</Button>
		</>
	);

	return (
		<Modal
			isOpen={isOpen}
			footer={footer}
			header={
				<div className="flex items-center justify-start">
					<H4 className="text-accent">Upload your avatar</H4>
				</div>
			}
			trigger={
				<Button onClick={() => setIsOpen(true)}>
					<PlusSquareIcon />
					<p>Upload avatar</p>
				</Button>
			}
		>
			<div className="rounded bg-light p-4 flex">
				<ReactCrop
					className="rounded border border-border"
					crop={crop}
					onChange={setCrop}
					circularCrop={true}
					locked={!isImage}
					aspect={isImage ? undefined : 16 / 9}
				>
					<img className="rounded" ref={imgRef} src={image} alt="cropping" />
				</ReactCrop>
			</div>
		</Modal>
	);
};
