import { Button } from "@client/components/Button/Button";
import {
	InputName,
	type InputNameRefType,
} from "@client/components/input/InputName";
import { Modal, type ModalRefType } from "@client/components/Modal";
import { TextArea, type TextAreaRefType } from "@client/components/TextArea";
import { Tabs } from "@client/components/tabs/Tabs";
import { H3, Label } from "@client/components/typography";
import { useAuth } from "@client/hooks/useAuth";
import { useGetGeolocation } from "@client/hooks/useGetGeolocation";
import { Separator, Toast, Tooltip } from "@heroui/react";
import { PulseEnum, UrgencyEnum } from "@shared/types";
import { MicIcon, PaperclipIcon } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { useCreatePulse } from "../hooks";

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

	const pulseTypeItems = useMemo(
		() => [
			{ label: "Emergency", key: PulseEnum.Emergency },
			{ label: "Skill", key: PulseEnum.Skill },
			{ label: "Item", key: PulseEnum.Item },
		],
		[],
	);

	const urgencyItems = useMemo(
		() => [
			{ label: "Immediate", key: UrgencyEnum.Immediate },
			{ label: "Urgent", key: UrgencyEnum.Urgent },
			{ label: "Not Urgent", key: UrgencyEnum.NotUrgent },
		],
		[],
	);

	const handleCreate = async () => {
		const isTitleValid = titleRef.current?.validate();
		const isDescriptionValid = descriptionRef.current?.validate();

		if (!isTitleValid || !isDescriptionValid) return;

		if (!coords) {
			Toast.toast.danger("Location is required. Please enable geolocation.");
			return;
		}

		if (!user?.user.id) {
			Toast.toast.danger("User not authenticated.");
			return;
		}

		try {
			await createPulse({
				title: titleRef.current?.getValue() || "",
				description: descriptionRef.current?.getValue() || "",
				type: pulseType,
				urgency: urgency,
				userId: user.user.id,
				position: { x: coords.long, y: coords.lat },
				isResolved: false,
			});
			Toast.toast.success("Pulse created successfully!");
			modalRef.current?.close();
		} catch (error) {
			console.error(error);
			Toast.toast.danger("Failed to create pulse. Please try again.");
		}
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
						size="sm"
						onPress={() => modalRef.current?.close()}
						isDisabled={isPending}
					>
						Cancel
					</Button>
					<Button
						variant="primary"
						size="sm"
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
						items={pulseTypeItems}
						selectedKey={pulseType}
						onSelectionChange={(key) => setPulseType(key as PulseEnum)}
					/>
				</div>

				<div className="flex flex-col gap-2">
					<Label className="text-accent font-semibold text-sm">Urgency</Label>
					<Tabs
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
					maxLength={30}
				/>

				<TextArea
					ref={descriptionRef}
					label="Description"
					placeholder="Describe what's happening..."
					maxLength={500}
				/>

				<div className="flex items-center justify-end gap-2">
					<Tooltip delay={0}>
						<Button
							variant="outline"
							isIconOnly
							radius="full"
							startContent={<PaperclipIcon className="size-4 text-accent" />}
						/>
						<Tooltip.Content className="border border-accent rounded-full bg-surface text-accent">
							Upload photo
						</Tooltip.Content>
					</Tooltip>
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
