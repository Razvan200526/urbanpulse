import { Button } from "@client/components/Button/Button";
import { ImageUploader } from "@client/components/ImageUploader";
import { normalizeAssetUrl } from "@client/utils/normalizeAssetUrl";
import { Toast } from "@heroui/react";
import { UploadCloud } from "lucide-react";

type LostDocumentUploaderProps = {
	isUploading: boolean;
	onUpload: (file: File) => Promise<void>;
};

export const LostDocumentUploader = ({
	isUploading,
	onUpload,
}: LostDocumentUploaderProps) => {
	return (
		<ImageUploader
			onSave={async (uploadedImageUrl) => {
				try {
					const response = await fetch(normalizeAssetUrl(uploadedImageUrl));
					if (!response.ok) {
						throw new Error("Failed to read uploaded image.");
					}

					const blob = await response.blob();
					const file = new File([blob], "lost-document-upload.jpg", {
						type: blob.type || "image/jpeg",
					});
					await onUpload(file);
				} catch (error) {
					Toast.toast.danger(
						error instanceof Error
							? error.message
							: "Failed to upload document.",
					);
				}
			}}
			trigger={(open) => (
				<Button
					size="md"
					variant="primary"
					startContent={<UploadCloud className="size-4" />}
					onPress={open}
					isPending={isUploading}
					isDisabled={isUploading}
				>
					Upload document
				</Button>
			)}
		/>
	);
};
