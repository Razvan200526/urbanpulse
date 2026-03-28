import { AudioRecorder } from "@client/components/audio/AudioRecordComponent";
import { Button } from "@client/components/Button/Button";
import { ImageUploader } from "@client/components/ImageUploader";
import {
	InputName,
	type InputNameRefType,
} from "@client/components/input/InputName";
import { Modal, type ModalRefType } from "@client/components/Modal";
import { TextArea, type TextAreaRefType } from "@client/components/TextArea";
import { type TabItemType, Tabs } from "@client/components/tabs/Tabs";
import { H3, Label } from "@client/components/typography";
import { useAuth } from "@client/hooks/useAuth";
import { useGetGeolocation } from "@client/hooks/useGetGeolocation";
import { Separator, Toast, Tooltip } from "@heroui/react";
import { PulseEnum, UrgencyEnum } from "@shared/types";
import { isBioValid } from "@shared/validators/isBioValid";
import { isNameValid } from "@shared/validators/isNameValid";
import { PaperclipIcon, XIcon } from "lucide-react";
import { useRef, useState } from "react";
import { useCreatePulse } from "../hooks";
import { useUploadAudio } from "@client/hooks/uploadHooks";
import { ImageList } from "./ImageList";

export const pulseTypeItems: TabItemType[] = [
	{
		key: PulseEnum.Emergency,
		label: "Emergency",
		className: "mx-2",
	},
	{
		key: PulseEnum.Skill,
		label: "Skill",
		className: "mx-2",
	},
	{
		key: PulseEnum.Item,
		label: "Item",
		className: "mx-2",
	},
];

export const urgencyItems: TabItemType[] = [
	{ label: "Immediate", key: UrgencyEnum.Immediate, className: "mx-2" },
	{ label: "Urgent", key: UrgencyEnum.Urgent, className: "mx-2" },
	{ label: "Not Urgent", key: UrgencyEnum.NotUrgent, className: "mx-2" },
];

export const CreatePulseModal = ({
	modalRef,
	emergencyLaunch = false,
}: {
	modalRef: React.RefObject<ModalRefType | null>;
	/** When true (e.g. Emergency shortcut), prefill title and lock Emergency + Immediate. */
	emergencyLaunch?: boolean;
}) => {
	const { data: user } = useAuth();
	const { coords, refresh } = useGetGeolocation({
		enableHighAccuracy: true,
	});
	const { mutateAsync: createPulse, isPending } = useCreatePulse();

	const titleRef = useRef<InputNameRefType>(null);
	const descriptionRef = useRef<TextAreaRefType>(null);
	const [pulseType, setPulseType] = useState<PulseEnum>(PulseEnum.Emergency);
	const [urgency, setUrgency] = useState<UrgencyEnum>(UrgencyEnum.Immediate);
	const [imageUrls, setImageUrls] = useState<string[]>([]);
	const [audioUrl, setAudioUrl] = useState<string>("");
	const audioRef = useRef<HTMLAudioElement>(null);
	const handleCreate = async () => {
		const title = titleRef.current?.getValue() || "";
		const description = descriptionRef.current?.getValue() || "";
		if (!isNameValid(title) || !isBioValid(description)) {
			Toast.toast.danger("Title and description are required.");
			return;
		}

		if (!coords) {
			refresh();
			Toast.toast.danger(
				"Location is required. Please enable geolocation in the browser.",
			);
			return;
		}

		console.log("Audio url : ", audioUrl);
		await createPulse({
			title,
			description,
			type: pulseType,
			urgency: urgency,
			userId: user?.user.id,
			position: { x: coords.long, y: coords.lat },
			imageUrls,
			isResolved: false,
			audioUrl: audioUrl,
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
				<Separator variant="tertiary" />

				<div className="flex flex-col gap-2">
					<Label className="text-accent font-semibold text-sm">
						Pulse Type
					</Label>
					<Tabs
						className="flex items-start"
						items={pulseTypeItems}
						selectedKey={pulseType}
						onSelectionChange={(key) => setPulseType(key as PulseEnum)}
					/>
				</div>

				<div className="flex flex-col gap-2">
					<Label className="text-accent font-semibold text-sm">Urgency</Label>
					<Tabs
						className="flex items-start"
						items={urgencyItems}
						selectedKey={urgency}
						onSelectionChange={(key) => setUrgency(key as UrgencyEnum)}
					/>
				</div>

				<InputName
					ref={titleRef}
					showIcon={false}
					label="Pulse name"
					placeholder="My pulse..."
					maxLength={20}
					initialValue={emergencyLaunch ? "Emergency need help" : ""}
				/>

				<TextArea
					ref={descriptionRef}
					label="Description"
					placeholder="Describe what's happening..."
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
								onRecordingComplete={(blobUrl) => {
									audioRef.current?.setAttribute("src", blobUrl);
								}}
								onUpload={(response) => setAudioUrl(response.url)}
							/>
						</div>
						<div className="flex items-center justify-end order-1 sm:order-2 shrink-0">
							<ImageUploader
								onSave={(url) => setImageUrls((prev) => [...prev, url])}
								trigger={(open) => (
									<Tooltip delay={0}>
										<Button
											variant="outline"
											isIconOnly
											radius="full"
											startContent={
												<PaperclipIcon className="size-4 text-accent" />
											}
											onPress={open}
										/>
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
