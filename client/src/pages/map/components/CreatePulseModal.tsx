import { Button } from "@client/components/Button/Button";
import { InputName } from "@client/components/input/InputName";
import { Modal } from "@client/components/Modal";
import { TextArea } from "@client/components/TextArea";
import { H6 } from "@client/components/typography";
import { Separator } from "@heroui/react";
import { PlusSquare, SeparatorVertical } from "lucide-react";

export const CreatePulseModal = () => {
	return (
		<Modal
			trigger={
				<Button
					variant="primary"
					startContent={<PlusSquare className="size-4" />}
				>
					Create pulse
				</Button>
			}
			header={
				<header>
					<H6>Create pulse modal</H6>
				</header>
			}
			footer={
				<div className="w-full flex items-center justify-end gap-4">
					<Button variant="danger" size="sm">
						Cancel
					</Button>
					<Button variant="primary" size="sm">
						Create
					</Button>
				</div>
			}
		>
			<div className="flex flex-col space-y-5">
				<Separator />
				<InputName label="Pulse name" placeholder="My pulse..." />
				<TextArea label="" />
				<Separator />
			</div>
		</Modal>
	);
};
