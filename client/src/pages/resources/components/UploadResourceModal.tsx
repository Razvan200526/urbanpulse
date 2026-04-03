import { Button } from "@client/components/Button/Button";
import { ImageUploader } from "@client/components/ImageUploader";
import {
	InputName,
	type InputNameRefType,
} from "@client/components/input/InputName";
import { ResponsiveChoiceField } from "@client/components/input/ResponsiveChoiceField";
import { Modal, type ModalRefType } from "@client/components/Modal";
import { TextArea, type TextAreaRefType } from "@client/components/TextArea";
import { type TabItemType } from "@client/components/tabs/Tabs";
import { H3 } from "@client/components/typography";
import { useAuth } from "@client/hooks/useAuth";
import { Separator, Toast, Tooltip } from "@heroui/react";
import { isCreateResourceReqValid } from "@shared/validators/resources/isResourceValid";
import { PaperclipIcon, XIcon } from "lucide-react";
import { useRef, useState } from "react";
import { useUploadResource } from "../hooks";

const resourceTypeItems: TabItemType[] = [
	{ label: "Skill", key: "Skill" },
	{ label: "Item", key: "Item" },
	{ label: "Space", key: "Space" },
];

const availabilityItems: TabItemType[] = [
	{ label: "Available", key: "Available" },
	{ label: "Unavailable", key: "Unavailable" },
];

export const UploadResourceModal = ({
	modalRef,
}: {
	modalRef: React.RefObject<ModalRefType | null>;
}) => {
	const { data: user } = useAuth();
	const nameRef = useRef<InputNameRefType>(null);
	const descriptionRef = useRef<TextAreaRefType>(null);
	const { mutateAsync: uploadResource } = useUploadResource(
		user?.user.id || "",
	);
	const [resourceType, setResourceType] = useState<string>("Skill");
	const [availability, setAvailability] = useState<string>("Available");
	const [imageUrls, setImageUrls] = useState<string[]>([]);

	const handleUpload = async () => {
		const { success, data, error } = isCreateResourceReqValid({
			userId: user?.user.id || "",
			name: nameRef.current?.getValue(),
			description: descriptionRef.current?.getValue(),
			availability,
			imageUrls,
		});
		if (error) {
			Toast.toast.danger("Invalid resource data");
			modalRef.current?.close();
			return;
		}
		if (success) {
			const response = await uploadResource(data);
			Toast.toast.success(response?.message);
			modalRef.current?.close();
		}
		modalRef.current?.close();
	};

	return (
		<Modal
			modalRef={modalRef}
			header={
				<header className="flex flex-col items-start justify-start">
					<H3>Upload Resource</H3>
					<p className="text-muted text-sm">Contribute to the community</p>
				</header>
			}
			footer={
				<div className="w-full flex items-center justify-end gap-4">
					<Button
						variant="danger"
						size="sm"
						onPress={() => modalRef.current?.close()}
					>
						Cancel
					</Button>
					<Button variant="primary" size="sm" onPress={handleUpload}>
						Upload
					</Button>
				</div>
			}
		>
			<div className="p-4 flex flex-col space-y-5">
				<Separator variant="tertiary" />

				<ResponsiveChoiceField
					label="Resource Type"
					items={resourceTypeItems}
					selectedKey={resourceType}
					onSelectionChange={setResourceType}
				/>

				<ResponsiveChoiceField
					label="Availability"
					items={availabilityItems}
					selectedKey={availability}
					onSelectionChange={setAvailability}
				/>

				<InputName
					ref={nameRef}
					showIcon={false}
					label="Resource name"
					placeholder="What are you offering?"
					maxLength={50}
				/>

				<TextArea
					ref={descriptionRef}
					label="Description"
					placeholder="Describe the resource, conditions, or any requirements..."
					maxLength={500}
				/>

				{imageUrls.length > 0 && (
					<div className="flex gap-2 items-center flex-wrap">
						{imageUrls.map((url) => (
							<div
								key={url}
								className="relative w-16 h-16 rounded overflow-hidden border border-border mt-2"
							>
								<img
									src={url}
									alt={`upload-${url}`}
									className="w-full h-full object-cover"
								/>
								<Button
									isIconOnly
									size="sm"
									variant="danger"
									className="absolute top-1 right-1 h-5 w-5 min-w-0 min-h-0 rounded-full bg-danger/80"
									onPress={() =>
										setImageUrls((p) => p.filter((u) => u !== url))
									}
								>
									<XIcon className="size-3" />
								</Button>
							</div>
						))}
					</div>
				)}

				<div className="flex items-center justify-end gap-2 mt-2">
					<ImageUploader
						onSave={(url) => setImageUrls((prev) => [...prev, url])}
						trigger={(open) => (
							<Tooltip delay={0}>
								<Tooltip.Trigger>
									<Button
										variant="outline"
										isIconOnly
										radius="full"
										startContent={
											<PaperclipIcon className="size-4 text-accent" />
										}
										onPress={open}
									/>
								</Tooltip.Trigger>
								<Tooltip.Content className="border border-accent rounded-full bg-surface text-accent">
									Upload photo
								</Tooltip.Content>
							</Tooltip>
						)}
					/>
				</div>
				<Separator variant="tertiary" />
			</div>
		</Modal>
	);
};
