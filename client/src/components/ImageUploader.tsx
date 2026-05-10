import { useUploadImage } from "@client/hooks/uploadHooks";
import { cn, Toast } from "@heroui/react";
import { PlusSquareIcon, UploadCloud, XIcon } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "./Button/Button";
import { Modal, type ModalRefType } from "./Modal";
import { H4 } from "./typography";

export type ImageUploaderPropsType = {
	onSave: (url: string) => void;
	trigger?: (open: () => void) => React.ReactNode;
};

export const ImageUploader = ({ onSave, trigger }: ImageUploaderPropsType) => {
	const { mutateAsync: uploadImage } = useUploadImage();
	const [isLoading, setIsLoading] = useState(false);
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);
	const modalRef = useRef<ModalRefType | null>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	const handleFileSelect = (file: File) => {
		const allowedFormats = [
			"image/jpeg",
			"image/jpg",
			"image/png",
			"image/webp",
		];
		if (!allowedFormats.includes(file.type)) {
			Toast.toast.danger("Unsupported file format.");
			return;
		}

		if (previewUrl) URL.revokeObjectURL(previewUrl);

		setSelectedFile(file);
		setPreviewUrl(URL.createObjectURL(file));
	};

	const onDragOver = (e: React.DragEvent<HTMLElement>) => {
		e.preventDefault();
		e.stopPropagation();
	};

	const onDrop = (e: React.DragEvent<HTMLElement>) => {
		e.preventDefault();
		e.stopPropagation();
		if (e.dataTransfer.files?.[0]) {
			handleFileSelect(e.dataTransfer.files[0]);
		}
	};

	const onUploadSave = async () => {
		if (selectedFile) {
			setIsLoading(true);
			try {
				const response = await uploadImage(selectedFile);
				if (!response.data.success || !response.data.url) {
					Toast.toast.danger(response.data.message || "Upload failed");
					return;
				}
				Toast.toast.success("Image uploaded successfully");
				onSave(response.data.url);
				modalRef.current?.close();
			} catch {
				Toast.toast.danger("Failed to upload image.");
			} finally {
				setIsLoading(false);
			}
		}
	};

	const handleClose = () => {
		setSelectedFile(null);
		if (previewUrl) URL.revokeObjectURL(previewUrl);
		setPreviewUrl(null);
		if (inputRef.current) inputRef.current.value = "";
	};

	const openModal = () => modalRef.current?.open();
	const closeModal = () => modalRef.current?.close();

	const footer = (
		<>
			<Button variant="danger-soft" onPress={closeModal} isDisabled={isLoading}>
				Cancel
			</Button>
			<Button
				variant="primary"
				onPress={onUploadSave}
				isPending={isLoading}
				isDisabled={!selectedFile}
			>
				Upload
			</Button>
		</>
	);

	return (
		<Modal
			modalRef={modalRef}
			onOpenChange={(open) => {
				if (!open) handleClose();
			}}
			footer={footer}
			trigger={
				trigger ? (
					trigger(openModal)
				) : (
					<Button onPress={openModal}>
						<PlusSquareIcon className="size-4" />
						<p>Upload photo</p>
					</Button>
				)
			}
		>
			<div className="p-4 flex flex-col items-center justify-center gap-4">
				<button
					type="button"
					className={cn(
						"flex-col rounded flex items-center justify-center bg-surface cursor-pointer relative w-full h-48",
						previewUrl
							? "p-2"
							: "border border-dashed border-border hover:bg-surface-secondary transition-colors duration-150 ease-in",
					)}
					onDragOver={onDragOver}
					onDrop={onDrop}
					onClick={() => !previewUrl && inputRef.current?.click()}
					onKeyDown={(e) => {
						if (e.key === "Enter" && !previewUrl) {
							inputRef.current?.click();
						}
					}}
				>
					{previewUrl ? (
						<img
							src={previewUrl}
							alt="Preview"
							className="w-full h-full object-contain rounded"
						/>
					) : (
						<div className="flex flex-col items-center gap-2 text-muted">
							<UploadCloud className="size-8 text-accent" />
							<p className="text-sm font-medium">
								Drag & drop or click to upload
							</p>
							<p className="text-xs">Supports JPG, PNG, WEBP</p>
						</div>
					)}
					<input
						ref={inputRef}
						type="file"
						accept=".jpg,.jpeg,.png,.webp"
						className="hidden"
						onChange={(e) => {
							if (e.target.files?.[0]) {
								handleFileSelect(e.target.files[0]);
							}
						}}
					/>
				</button>
			</div>
		</Modal>
	);
};
