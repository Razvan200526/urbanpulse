import { Button } from "@client/components/Button/Button";
import { ImageUploader } from "@client/components/ImageUploader";
import {
	InputName,
	type InputNameRefType,
} from "@client/components/input/InputName";
import { ResponsiveChoiceField } from "@client/components/input/ResponsiveChoiceField";
import { Modal, type ModalRefType } from "@client/components/Modal";
import { TextArea, type TextAreaRefType } from "@client/components/TextArea";
import type { TabItemType } from "@client/components/tabs/Tabs";
import { H4 } from "@client/components/typography";
import { useAuth } from "@client/hooks/useAuth";
import { useGetGeolocation } from "@client/hooks/useGetGeolocation";
import { normalizeAssetUrl } from "@client/utils/normalizeAssetUrl";
import { Toast, Tooltip } from "@heroui/react";
import type { ResourceAvailabilityType, ResourceItemType } from "@shared/types";
import { isCreateResourceReqValid } from "@shared/validators/resources/isResourceValid";
import { PaperclipIcon, UploadCloudIcon, XIcon } from "lucide-react";
import { useRef, useState } from "react";
import { useUploadResource } from "../hooks";

const resourceTypeItems: TabItemType[] = [
	{ label: "Skill", key: "Skill" },
	{ label: "Item", key: "Item" },
	{ label: "Location", key: "Location" },
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
	const { coords, isLoading: isLocationLoading } = useGetGeolocation();
	const nameRef = useRef<InputNameRefType>(null);
	const descriptionRef = useRef<TextAreaRefType>(null);
	const { mutateAsync: uploadResource } = useUploadResource(
		user?.user.id || "",
	);
	const [resourceType, setResourceType] = useState<ResourceItemType>("Skill");
	const [availability, setAvailability] =
		useState<ResourceAvailabilityType>("Available");
	const [imageUrls, setImageUrls] = useState<string[]>([]);

	const resetForm = () => {
		setResourceType("Skill");
		setAvailability("Available");
		setImageUrls([]);
		nameRef.current?.setValue("");
		descriptionRef.current?.setValue("");
	};

	const closeModal = () => {
		resetForm();
		modalRef.current?.close();
	};

	const handleUpload = async () => {
		if (!user?.user.id) {
			Toast.toast.danger("You need to be signed in to upload a resource.");
			return;
		}

		if (!coords) {
			Toast.toast.danger(
				isLocationLoading
					? "Location is still loading. Please try again."
					: "Location is required. Please enable geolocation in the browser.",
			);
			return;
		}

		const { success, data, error } = isCreateResourceReqValid({
			name: nameRef.current?.getValue(),
			description: descriptionRef.current?.getValue(),
			availability,
			resourceType,
			position: { x: coords.long, y: coords.lat },
			imageUrls,
		});
		if (error) {
			Toast.toast.danger("Invalid resource data");
			return;
		}
		if (success) {
			const response = await uploadResource(data);
			if (response?.message) {
				Toast.toast.success(response.message);
			}
			closeModal();
		}
	};

	return (
		<Modal
			modalRef={modalRef}
			header={
				<header className="flex flex-col items-start justify-start space-y-2">
					<div className="flex items-center gap-2">
						<UploadCloudIcon className="size-5 text-accent" />
						<H4>Upload</H4>
					</div>
					<p className="text-muted text-sm">Contribute to the community</p>
				</header>
			}
			footer={
				<div className="w-full flex items-center justify-end gap-4">
					<Button variant="danger" size="sm" onPress={closeModal}>
						Cancel
					</Button>
					<Button variant="primary" size="sm" onPress={handleUpload}>
						Upload
					</Button>
				</div>
			}
		>
			<div className="p-4 flex flex-col space-y-5">
				<ResponsiveChoiceField
					label="Type"
					items={resourceTypeItems}
					selectedKey={resourceType}
					onSelectionChange={(key) => setResourceType(key as ResourceItemType)}
				/>

				<ResponsiveChoiceField
					label="Availability"
					items={availabilityItems}
					selectedKey={availability}
					onSelectionChange={(key) =>
						setAvailability(key as ResourceAvailabilityType)
					}
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
									src={normalizeAssetUrl(url)}
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
			</div>
		</Modal>
	);
};
