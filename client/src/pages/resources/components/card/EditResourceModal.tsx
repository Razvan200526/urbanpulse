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
import { H3 } from "@client/components/typography";
import { normalizeAssetUrl } from "@client/utils/normalizeAssetUrl";
import { Toast } from "@heroui/react";
import type { ResourceAvailabilityType, ResourceItemType } from "@shared/types";
import { isUpdateResourceReqValid } from "@shared/validators/resources/isResourceValid";
import { EditIcon, PaperclipIcon, XIcon } from "lucide-react";
import { type RefObject, useEffect, useRef, useState } from "react";
import { useUpdateResource } from "../../hooks";
import type { ResourceWithUsersType } from "../../resourceResponses";

const resourceTypeItems: TabItemType[] = [
	{ label: "Skill", key: "Skill" },
	{ label: "Item", key: "Item" },
	{ label: "Location", key: "Location" },
];

const availabilityItems: TabItemType[] = [
	{ label: "Available", key: "Available" },
	{ label: "Unavailable", key: "Unavailable" },
	{ label: "Currently Unavailable", key: "Currently Unavailable" },
];

type EditResourceModalProps = {
	resource: ResourceWithUsersType["resource"];
	modalRef: RefObject<ModalRefType | null>;
};

export const EditResourceModal = ({
	resource,
	modalRef,
}: EditResourceModalProps) => {
	const nameRef = useRef<InputNameRefType>(null);
	const descriptionRef = useRef<TextAreaRefType>(null);
	const [resourceType, setResourceType] = useState<ResourceItemType>(
		resource.resourceType,
	);
	const [availability, setAvailability] = useState<ResourceAvailabilityType>(
		resource.availability,
	);
	const [imageUrls, setImageUrls] = useState<string[]>(
		resource.imageUrls ?? [],
	);
	const { mutateAsync: updateResource, isPending } = useUpdateResource();

	const handleSave = async () => {
		const result = isUpdateResourceReqValid({
			name: nameRef.current?.getValue(),
			description: descriptionRef.current?.getValue(),
			availability,
			resourceType,
			imageUrls,
		});

		if (!result.success) {
			Toast.toast.danger("Invalid resource data");
			return;
		}

		await updateResource({
			resourceId: resource.id,
			...result.data,
		});
		modalRef.current?.close();
	};

	const handleAddImage = (url: string) => {
		if (imageUrls.length >= 6) {
			Toast.toast.danger("You can upload up to 6 photos.");
			return;
		}

		setImageUrls((prev) => (prev.includes(url) ? prev : [...prev, url]));
	};

	return (
		<Modal
			modalRef={modalRef}
			header={
				<header className="flex flex-col items-start justify-start">
					<div className="flex items-center gap-2">
						<EditIcon className="size-4 text-accent" />
						<H3>Edit Resource</H3>
					</div>
				</header>
			}
			footer={
				<div className="flex w-full items-center justify-end gap-4">
					<Button
						variant="danger"
						size="sm"
						onPress={() => modalRef.current?.close()}
					>
						Cancel
					</Button>
					<Button
						variant="primary"
						size="sm"
						onPress={handleSave}
						isPending={isPending}
					>
						Save
					</Button>
				</div>
			}
		>
			<div className="flex flex-col space-y-5 p-4">
				<ResponsiveChoiceField
					label="Resource Type"
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
					className="max-w-sm"
					ref={nameRef}
					showIcon={false}
					label="Resource name"
					placeholder="What are you offering?"
					initialValue={resource.name}
					maxLength={100}
				/>

				<TextArea
					inputWrapperClassname="min-h-30"
					className="max-h-40 max-w-sm"
					ref={descriptionRef}
					label="Description"
					placeholder="Describe the resource, conditions, or any requirements..."
					initialValue={resource.description ?? ""}
					maxLength={500}
				/>

				{imageUrls.length > 0 && (
					<div className="flex flex-wrap items-center gap-2">
						{imageUrls.map((url, index) => (
							<div
								key={url}
								className="relative mt-2 h-16 w-16 overflow-hidden rounded border border-border"
							>
								<img
									src={normalizeAssetUrl(url)}
									alt={`resource upload ${index + 1}`}
									className="h-full w-full object-cover"
								/>
								<Button
									isIconOnly
									size="sm"
									variant="danger"
									className="absolute top-1 right-1 h-5 min-h-0 w-5 min-w-0 rounded-full bg-danger/80"
									onPress={() =>
										setImageUrls((prev) => prev.filter((item) => item !== url))
									}
								>
									<XIcon className="size-3" />
								</Button>
							</div>
						))}
					</div>
				)}

				<div className="flex items-center justify-end gap-2">
					<ImageUploader
						onSave={handleAddImage}
						trigger={(open) => (
							<Button
								variant="outline"
								size="sm"
								isIconOnly
								radius="full"
								startContent={<PaperclipIcon className="size-4 text-accent" />}
								onPress={open}
							/>
						)}
					/>
				</div>
			</div>
		</Modal>
	);
};
