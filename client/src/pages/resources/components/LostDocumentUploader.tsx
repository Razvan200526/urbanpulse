import { Button } from "@client/components/Button/Button";
import { Toast } from "@heroui/react";
import { UploadCloud, XIcon } from "lucide-react";
import { useMemo, useRef, useState } from "react";

const ALLOWED_FILE_TYPES = [
	"image/jpeg",
	"image/jpg",
	"image/png",
	"image/webp",
];

type LostDocumentUploaderProps = {
	isUploading: boolean;
	onUpload: (file: File) => Promise<void>;
};

export const LostDocumentUploader = ({
	isUploading,
	onUpload,
}: LostDocumentUploaderProps) => {
	const inputRef = useRef<HTMLInputElement>(null);
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);

	const helperText = useMemo(() => {
		if (!selectedFile) {
			return "Supported formats: JPG, PNG, WEBP";
		}
		const kb = Math.round(selectedFile.size / 1024);
		return `${selectedFile.name} (${kb} KB)`;
	}, [selectedFile]);

	const onFileSelect = (file: File | undefined) => {
		if (!file) return;
		if (!ALLOWED_FILE_TYPES.includes(file.type)) {
			Toast.toast.danger("Please upload a JPG, PNG, or WEBP image.");
			return;
		}

		if (previewUrl) {
			URL.revokeObjectURL(previewUrl);
		}
		setSelectedFile(file);
		setPreviewUrl(URL.createObjectURL(file));
	};

	const reset = () => {
		setSelectedFile(null);
		if (previewUrl) {
			URL.revokeObjectURL(previewUrl);
		}
		setPreviewUrl(null);
		if (inputRef.current) {
			inputRef.current.value = "";
		}
	};

	return (
		<section className="rounded border border-border bg-surface p-4 sm:p-5">
			<div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
				<div>
					<h3 className="text-base font-semibold text-foreground">
						Upload a Found Document
					</h3>
					<p className="mt-1 text-sm text-muted">
						We mask sensitive fields automatically and run secure partial
						matching.
					</p>
				</div>
				<div className="flex flex-wrap items-center gap-2">
					<Button
						variant="outline"
						onPress={() => inputRef.current?.click()}
						startContent={<UploadCloud className="size-4" />}
					>
						Choose file
					</Button>
					<Button
						variant="primary"
						onPress={async () => {
							if (!selectedFile) {
								Toast.toast.danger("Select a document image first.");
								return;
							}
							await onUpload(selectedFile);
							reset();
						}}
						isPending={isUploading}
						isDisabled={!selectedFile || isUploading}
					>
						Upload document
					</Button>
				</div>
			</div>

			<input
				ref={inputRef}
				type="file"
				accept=".jpg,.jpeg,.png,.webp"
				className="hidden"
				onChange={(event) => {
					onFileSelect(event.target.files?.[0]);
				}}
			/>

			<div className="mt-4 rounded border border-dashed border-border bg-surface-secondary/30 p-3">
				{previewUrl ? (
					<div className="flex items-start gap-3">
						<img
							src={previewUrl}
							alt="Selected document preview"
							className="h-20 w-20 rounded object-cover border border-border"
						/>
						<div className="min-w-0 flex-1">
							<p className="truncate text-sm font-medium text-foreground">
								{selectedFile?.name}
							</p>
							<p className="text-xs text-muted">{helperText}</p>
						</div>
						<Button isIconOnly variant="danger-soft" onPress={reset}>
							<XIcon className="size-4" />
						</Button>
					</div>
				) : (
					<p className="text-sm text-muted">{helperText}</p>
				)}
			</div>
		</section>
	);
};
