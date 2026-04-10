import { Button } from "@client/components/Button/Button";
import { ProgressChip } from "@client/components/chips/ProgressChip";
import { ImageUploader } from "@client/components/ImageUploader";
import {
	InputName,
	type InputNameRefType,
} from "@client/components/input/InputName";
import { ResponsiveChoiceField } from "@client/components/input/ResponsiveChoiceField";
import { Modal, type ModalRefType } from "@client/components/Modal";
import { TextArea, type TextAreaRefType } from "@client/components/TextArea";
import { useAuth } from "@client/hooks/useAuth";
import { useGetGeolocation } from "@client/hooks/useGetGeolocation";
import { useCreatePulse } from "@client/pages/map/hooks";
import { normalizeAssetUrl } from "@client/utils/normalizeAssetUrl";
import {
	type PetAlertFormValues,
	petAlertFormSchema,
} from "@client/utils/petAlerts";
import { Chip, Toast } from "@heroui/react";
import {
	PetAlertTypeEnum,
	PetAlertUploadStatusEnum,
	PulseEnum,
	UrgencyEnum,
} from "@shared/types";
import { Image } from "lucide-react";
import { useRef, useState } from "react";
import { useCreatePetAlert, usePetAlertSocket } from "../hooks";

const alertTypeItems = [
	{ key: PetAlertTypeEnum.Lost, label: "Lost", className: "mx-2" },
	{ key: PetAlertTypeEnum.Found, label: "Found", className: "mx-2" },
];

const urgencyItems = [
	{ key: UrgencyEnum.Urgent, label: "Urgent", className: "mx-2" },
	{ key: UrgencyEnum.Immediate, label: "Immediate", className: "mx-2" },
	{ key: UrgencyEnum.NotUrgent, label: "Not urgent", className: "mx-2" },
];

const uploadStatusLabels: Record<PetAlertUploadStatusEnum, string> = {
	[PetAlertUploadStatusEnum.Pending]: "Uploading",
	[PetAlertUploadStatusEnum.Processing]: "Uploading",
	[PetAlertUploadStatusEnum.Success]: "Success",
	[PetAlertUploadStatusEnum.Failed]: "Failed",
};

const defaultFormValues: PetAlertFormValues = {
	userId: "",
	alertType: PetAlertTypeEnum.Lost,
	petType: "Dog",
	color: "",
	breed: "",
	notes: "",
	imageUrl: "",
	urgency: UrgencyEnum.Urgent,
};

const buildPulseTitle = (values: PetAlertFormValues) => {
	const tone = values.alertType === PetAlertTypeEnum.Lost ? "Lost" : "Found";
	const breed = values.breed?.trim();
	const color = values.color?.trim();
	return [tone, color, breed, values.petType.trim()].filter(Boolean).join(" ");
};

const buildPulseDescription = (values: PetAlertFormValues) => {
	if (values.notes?.trim()) {
		return values.notes.trim();
	}

	const verb = values.alertType === PetAlertTypeEnum.Lost ? "lost" : "found";
	return `${values.color?.trim()} ${values.petType.trim()} ${verb} near the reported location.`;
};

interface CreateAlertModalProps {
	modalRef: React.RefObject<ModalRefType | null>;
	onSuccess?: () => void;
}

export const CreateAlertModal = ({
	modalRef,
	onSuccess,
}: CreateAlertModalProps) => {
	const { data: user } = useAuth();
	const currentUserId = user?.user.id || "";
	const { coords, isError: locationError } = useGetGeolocation();
	const { mutateAsync: createPulse, isPending: isCreatingPulse } =
		useCreatePulse();
	const { mutateAsync: createAlert, isPending: isCreatingAlert } =
		useCreatePetAlert();

	const petTypeRef = useRef<InputNameRefType>(null);
	const colorRef = useRef<InputNameRefType>(null);
	const breedRef = useRef<InputNameRefType>(null);
	const notesRef = useRef<TextAreaRefType>(null);

	const [alertType, setAlertType] = useState(defaultFormValues.alertType);
	const [urgency, setUrgency] = useState(defaultFormValues.urgency);
	const [imageUrl, setImageUrl] = useState(defaultFormValues.imageUrl);
	const [draftPulseId, setDraftPulseId] = useState<string | null>(null);
	const [activeRequestId, setActiveRequestId] = useState<string | null>(null);

	const { socketConnected, uploadStatus, syncUpload, reset, markUploadFailed } =
		usePetAlertSocket({
			userId: currentUserId,
			activeRequestId,
			onUploadSuccess: () => {
				setDraftPulseId(null);
				setActiveRequestId(null);
				onSuccess?.();
				setTimeout(() => modalRef.current?.close(), 1500);
			},
		});

	const isSubmitting = isCreatingPulse || isCreatingAlert;

	const getFormValues = (): PetAlertFormValues => ({
		userId: currentUserId,
		alertType,
		petType: petTypeRef.current?.getValue() ?? defaultFormValues.petType,
		color: colorRef.current?.getValue() ?? defaultFormValues.color,
		breed: breedRef.current?.getValue() ?? defaultFormValues.breed,
		notes: notesRef.current?.getValue() ?? defaultFormValues.notes,
		imageUrl,
		urgency,
	});

	const resetForm = () => {
		setAlertType(defaultFormValues.alertType);
		setUrgency(defaultFormValues.urgency);
		setImageUrl(defaultFormValues.imageUrl);
		setDraftPulseId(null);
		setActiveRequestId(null);
		petTypeRef.current?.setValue(defaultFormValues.petType);
		colorRef.current?.setValue(defaultFormValues.color);
		breedRef.current?.setValue(defaultFormValues.breed ?? "");
		notesRef.current?.setValue(defaultFormValues.notes ?? "");
		reset();
	};

	const handleSubmit = async () => {
		if (!currentUserId) {
			Toast.toast.danger("You must be signed in to submit a pet alert.");
			return;
		}

		const parsed = petAlertFormSchema.safeParse(getFormValues());
		if (!parsed.success) {
			Toast.toast.danger("Please complete all required pet alert fields.");
			return;
		}

		if (!coords) {
			Toast.toast.danger(
				locationError || "Location is required. Please enable geolocation.",
			);
			return;
		}

		reset();

		try {
			let pulseId = draftPulseId;
			if (!pulseId) {
				const pulseResponse = await createPulse({
					type: PulseEnum.Item,
					urgency: parsed.data.urgency,
					title: buildPulseTitle(parsed.data),
					description: buildPulseDescription(parsed.data),
					position: { x: coords.long, y: coords.lat },
					imageUrls: [parsed.data.imageUrl],
				});
				pulseId = pulseResponse.data.id;
				setDraftPulseId(pulseId);
			}

			const requestId = crypto.randomUUID();
			setActiveRequestId(requestId);

			const accepted = await createAlert({
				requestId,
				pulseId,
				userId: currentUserId,
				alertType: parsed.data.alertType,
				petType: parsed.data.petType.trim(),
				color: parsed.data.color.trim(),
				breed: parsed.data.breed?.trim() || null,
				imageUrl: parsed.data.imageUrl,
			});

			await syncUpload(user?.user.id || "", accepted);
		} catch (error) {
			markUploadFailed();
			Toast.toast.danger(
				error instanceof Error ? error.message : "Failed to submit pet alert.",
			);
		}
	};

	return (
		<Modal
			modalRef={modalRef}
			header={
				<div className="flex flex-wrap items-center justify-between gap-3">
					<div className="min-w-0">
						<h3 className="text-lg font-semibold">Report a pet</h3>
						<p className="text-sm text-muted">
							Create the pulse first, then let the AI service upload, embed, and
							match it in the background.
						</p>
					</div>
					<div className="flex flex-wrap items-center gap-3">
						{uploadStatus ? (
							<ProgressChip
								status={uploadStatus}
								label={uploadStatusLabels[uploadStatus]}
							/>
						) : null}
						<Chip className="rounded-full border border-accent/30 bg-accent/5 text-accent text-xs">
							{socketConnected ? "Online" : "Connecting..."}
						</Chip>
					</div>
				</div>
			}
			footer={
				<div className="flex w-full justify-end gap-3">
					<Button
						variant="secondary"
						onPress={resetForm}
						isDisabled={isSubmitting}
					>
						Reset
					</Button>
					<Button
						variant="primary"
						onPress={handleSubmit}
						isPending={isSubmitting}
					>
						Submit pet alert
					</Button>
				</div>
			}
		>
			<div className="space-y-5 p-1">
				<ResponsiveChoiceField
					label="Alert type"
					items={alertTypeItems}
					selectedKey={alertType}
					onSelectionChange={(key) => setAlertType(key as PetAlertTypeEnum)}
				/>

				<div className="grid gap-4 md:grid-cols-2">
					<InputName
						ref={petTypeRef}
						showIcon={false}
						label="Pet type"
						placeholder="Dog, cat, other pet"
						initialValue={defaultFormValues.petType}
					/>

					<InputName
						ref={colorRef}
						showIcon={false}
						label="Color"
						placeholder="Brown, black, white..."
						initialValue={defaultFormValues.color}
					/>
				</div>

				<InputName
					ref={breedRef}
					showIcon={false}
					label="Breed"
					placeholder="Optional breed detail"
					initialValue={defaultFormValues.breed ?? ""}
				/>

				<TextArea
					ref={notesRef}
					label="Notes"
					placeholder="Tell neighbors where the pet was last seen or found."
					initialValue={defaultFormValues.notes ?? ""}
					required={false}
				/>

				<ResponsiveChoiceField
					label="Urgency"
					items={urgencyItems}
					selectedKey={urgency}
					onSelectionChange={(key) => setUrgency(key as UrgencyEnum)}
				/>

				<div className="rounded border border-accent/40 bg-accent/5 p-4">
					<div className="flex flex-wrap items-center justify-between gap-3">
						<div>
							<p className="text-sm font-semibold text-accent">Pet image</p>
							<p className="text-xs text-muted">
								This first version requires one clear image for AI matching.
							</p>
						</div>
						<ImageUploader
							onSave={setImageUrl}
							trigger={(open) => (
								<Button
									size="sm"
									variant="primary"
									onPress={open}
									startContent={<Image className="size-4" />}
								>
									Upload image
								</Button>
							)}
						/>
					</div>

					{imageUrl ? (
						<div className="mt-4 overflow-hidden rounded border border-border bg-surface">
							<img
								src={normalizeAssetUrl(imageUrl)}
								alt="Uploaded pet preview"
								className="h-64 w-full object-cover"
							/>
						</div>
					) : null}
				</div>
			</div>
		</Modal>
	);
};
