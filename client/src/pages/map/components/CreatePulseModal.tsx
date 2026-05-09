import { AudioRecorder } from "@client/components/audio/AudioRecordComponent";
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
import { H3, Label } from "@client/components/typography";
import { useAuth } from "@client/hooks/useAuth";
import { useIncidentTypes } from "@client/hooks/useIncidentTypes";
import { ListBox, ListBoxItem, Select, Toast, Tooltip } from "@heroui/react";
import {
	DefaultIncidentTypeSlugEnum,
	PulseEnum,
	UrgencyEnum,
} from "@shared/types";
import { isBioValid } from "@shared/validators/isBioValid";
import { isNameValid } from "@shared/validators/isNameValid";
import { PaperclipIcon } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useCreatePulse } from "../hooks";
import { ImageList } from "./ImageList";

export const pulseTypeItems: TabItemType[] = [
	{ key: PulseEnum.Emergency, label: "Emergency", className: "mx-2" },
	{ key: PulseEnum.Skill, label: "Skill", className: "mx-2" },
	{ key: PulseEnum.Item, label: "Item", className: "mx-2" },
];

export const urgencyItems: TabItemType[] = [
	{ label: "Immediate", key: UrgencyEnum.Immediate, className: "mx-2" },
	{ label: "Urgent", key: UrgencyEnum.Urgent, className: "mx-2" },
	{ label: "Not Urgent", key: UrgencyEnum.NotUrgent, className: "mx-2" },
];

export const CreatePulseModal = ({
	modalRef,
	emergencyLaunch = false,
	safetyCheckinLaunch = false,
	coords,
}: {
	modalRef: React.RefObject<ModalRefType | null>;
	emergencyLaunch?: boolean;
	safetyCheckinLaunch?: boolean;
	coords?: { lat: number; long: number };
}) => {
	const { data: user } = useAuth();
	const { mutateAsync: createPulse, isPending } = useCreatePulse();
	const { data: incidentTypes = [] } = useIncidentTypes();

	const titleRef = useRef<InputNameRefType>(null);
	const descriptionRef = useRef<TextAreaRefType>(null);
	const audioUrlRef = useRef<string>("");
	const audioRef = useRef<HTMLAudioElement>(null);

	const [pulseType, setPulseType] = useState<PulseEnum>(
		() => PulseEnum.Emergency,
	);
	const [urgency, setUrgency] = useState<UrgencyEnum>(() =>
		safetyCheckinLaunch ? UrgencyEnum.NotUrgent : UrgencyEnum.Immediate,
	);
	const [incidentTypeId, setIncidentTypeId] = useState("");
	const [imageUrls, setImageUrls] = useState<string[]>([]);
	const fallbackIncidentType = useMemo(
		() =>
			incidentTypes.find(
				(item) => item.slug === DefaultIncidentTypeSlugEnum.Other,
			) ?? incidentTypes[0],
		[incidentTypes],
	);
	const showIncidentTypePicker = pulseType === PulseEnum.Emergency;
	const defaultTitle = safetyCheckinLaunch
		? "Safety check-in"
		: emergencyLaunch
			? "Emergency need help"
			: "";
	const defaultDescription = safetyCheckinLaunch
		? "Checking in during the weather alert. I'm safe right now and can coordinate with neighbours if needed."
		: "";

	useEffect(() => {
		if (!showIncidentTypePicker || incidentTypes.length === 0) {
			return;
		}

		const selected = incidentTypes.find((item) => item.id === incidentTypeId);
		if (!selected && fallbackIncidentType) {
			setIncidentTypeId(fallbackIncidentType.id);
		}
	}, [
		fallbackIncidentType,
		incidentTypeId,
		incidentTypes,
		showIncidentTypePicker,
	]);

	const handleCreate = async () => {
		const title = titleRef.current?.getValue() ?? "";
		const description = descriptionRef.current?.getValue() ?? "";

		if (!isNameValid(title) || !isBioValid(description)) {
			Toast.toast.danger("Title and description are required.");
			return;
		}

		if (!coords) {
			Toast.toast.danger(
				"Location is required. Please enable geolocation in the browser.",
			);
			return;
		}

		if (!user?.user.id) {
			Toast.toast.danger("You need to be signed in to create a pulse.");
			return;
		}

		await createPulse({
			title,
			description,
			type: pulseType,
			...(pulseType === PulseEnum.Emergency && incidentTypeId
				? { incidentTypeId }
				: {}),
			urgency,
			position: { x: coords.long, y: coords.lat },
			imageUrls,
			...(audioUrlRef.current.trim()
				? { audioUrl: audioUrlRef.current.trim() }
				: {}),
		});

		modalRef.current?.close();
	};

	return (
		<Modal
			modalRef={modalRef}
			header={
				<header className="flex flex-col items-start justify-start">
					<H3>Create pulse</H3>
					<p className="text-muted text-sm">Seek out help</p>
				</header>
			}
			footer={
				<div className="w-full flex items-center justify-end gap-4">
					<Button
						variant="danger"
						onPress={() => modalRef.current?.close()}
						isDisabled={isPending}
					>
						Cancel
					</Button>
					<Button
						variant="primary"
						onPress={handleCreate}
						isPending={isPending}
					>
						Create
					</Button>
				</div>
			}
		>
			<div className="p-4 flex flex-col space-y-5">
				<ResponsiveChoiceField
					label="Pulse Type"
					items={pulseTypeItems}
					selectedKey={pulseType}
					onSelectionChange={(key) => {
						setPulseType(key as PulseEnum);
						if (key !== PulseEnum.Emergency) {
							setIncidentTypeId("");
						}
					}}
				/>

				{showIncidentTypePicker && (
					<Select>
						<Label className="text-accent">Incident type</Label>
						<Select.Trigger className="text-accent border border-accent rounded">
							<Select.Value />
							<Select.Indicator />
						</Select.Trigger>
						<Select.Popover className="border border-accent">
							<ListBox
								className="rounded"
								items={incidentTypes}
								onSelectionChange={(keys) => {
									const key = Array.from(keys)[0];
									if (key) setIncidentTypeId(key.toString());
								}}
							>
								{(item) => (
									<ListBoxItem
										className="text-muted bg-surface hover:text-accent-hover"
										key={item.id}
										id={item.id}
										textValue={item.label}
									>
										{item.label}
									</ListBoxItem>
								)}
							</ListBox>
						</Select.Popover>
					</Select>
				)}

				<ResponsiveChoiceField
					label="Urgency"
					items={urgencyItems}
					selectedKey={urgency}
					onSelectionChange={(key) => setUrgency(key as UrgencyEnum)}
				/>

				<InputName
					ref={titleRef}
					showIcon={false}
					label="Pulse name"
					placeholder="My pulse..."
					maxLength={100}
					initialValue={defaultTitle}
				/>

				<TextArea
					ref={descriptionRef}
					label="Description"
					placeholder="Describe what's happening..."
					initialValue={defaultDescription}
					maxLength={100}
				/>

				<div className="flex flex-col gap-3 bg-surface-secondary/30 p-3 rounded border border-accent">
					<div className="flex items-center justify-between">
						<span className="text-sm font-semibold text-accent">
							Media & Attachments
						</span>
					</div>

					{imageUrls.length > 0 && <ImageList imageUrls={imageUrls} />}

					<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
						<div className="flex items-center order-2 sm:order-1 flex-1">
							<AudioRecorder
								audioRef={audioRef}
								onUpload={(response) => {
									audioUrlRef.current = response.data.url;
								}}
							/>
						</div>
						<div className="flex items-center justify-end order-1 sm:order-2 shrink-0">
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
										<Tooltip.Content className="rounded-full border border-accent text-accent">
											Upload Images
										</Tooltip.Content>
									</Tooltip>
								)}
							/>
						</div>
					</div>
				</div>
			</div>
		</Modal>
	);
};
