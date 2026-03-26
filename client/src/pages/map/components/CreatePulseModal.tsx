import { Button } from "@client/components/Button/Button";
import {
	InputName,
	type InputNameRefType,
} from "@client/components/input/InputName";
import { Modal, type ModalRefType } from "@client/components/Modal";
import { TextArea, type TextAreaRefType } from "@client/components/TextArea";
import { TabItemType, Tabs } from "@client/components/tabs/Tabs";
import { H3, Label } from "@client/components/typography";
import { useAuth } from "@client/hooks/useAuth";
import { useGetGeolocation } from "@client/hooks/useGetGeolocation";
import { Separator, Toast, Tooltip } from "@heroui/react";
import { PulseEnum, UrgencyEnum } from "@shared/types";
import { MicIcon, PaperclipIcon, XIcon } from "lucide-react";
import { useRef, useState } from "react";
import { useCreatePulse } from "../hooks";
import { ImageUploader } from "@client/components/ImageUploader";
import { isNameValid } from "@shared/validators/isNameValid";
import { isBioValid } from "@shared/validators/isBioValid";

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
}: {
	modalRef: React.RefObject<ModalRefType | null>;
}) => {
	const { data: user } = useAuth();
	const { coords } = useGetGeolocation({
		enableHighAccuracy: true,
	});
	const { mutateAsync: createPulse, isPending } = useCreatePulse();

	const titleRef = useRef<InputNameRefType>(null);
	const descriptionRef = useRef<TextAreaRefType>(null);
	const [pulseType, setPulseType] = useState<PulseEnum>(PulseEnum.Emergency);
	const [urgency, setUrgency] = useState<UrgencyEnum>(UrgencyEnum.Immediate);
	const [imageUrls, setImageUrls] = useState<string[]>([]);

	const handleCreate = async () => {
		const title = titleRef.current?.getValue() || "";
		const description = descriptionRef.current?.getValue() || "";
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

		await createPulse({
			title,
			description,
			type: pulseType,
			urgency: urgency,
			userId: user?.user.id,
			position: { x: coords.long, y: coords.lat },
			imageUrls,
			isResolved: false,
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
				/>

				<TextArea
					ref={descriptionRef}
					label="Description"
					placeholder="Describe what's happening..."
					maxLength={100}
				/>

				{imageUrls.length > 0 && (
					<div className="flex gap-2 items-center justify-start flex-wrap">
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
								<Button
									variant="outline"
									isIconOnly
									radius="full"
									startContent={
										<PaperclipIcon className="size-4 text-accent" />
									}
									onPress={open}
								/>
								<Tooltip.Content className="border border-accent rounded-full bg-surface text-accent">
									Upload photo
								</Tooltip.Content>
							</Tooltip>
						)}
					/>
					<Tooltip delay={0}>
						<Button
							variant="outline"
							isIconOnly
							radius="full"
							startContent={<MicIcon className="size-4 text-accent" />}
						/>
						<Tooltip.Content className="border border-accent rounded-full bg-surface text-accent">
							Record audio
						</Tooltip.Content>
					</Tooltip>
				</div>
				<Separator variant="tertiary" />
			</div>
		</Modal>
	);
};
