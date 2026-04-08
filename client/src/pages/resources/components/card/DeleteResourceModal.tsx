import { Button } from "@client/components/Button/Button";
import { Modal, type ModalRefType } from "@client/components/Modal";
import { H4 } from "@client/components/typography";
import type { ResourceType } from "@server/db/schema";
import { TrashIcon } from "lucide-react";
import type { RefObject } from "react";
import { useDeleteResource } from "../../hooks";

export const DeleteResourceModal = ({
	resource,
	modalRef,
}: {
	resource: ResourceType;
	modalRef: RefObject<ModalRefType | null>;
}) => {
	const { mutateAsync: deleteResource, isPending } = useDeleteResource();
	return (
		<Modal
			modalRef={modalRef}
			header={
				<header className="flex flex-col items-start justify-start">
					<div className="flex items-center gap-2">
						<TrashIcon className="size-4 text-danger" />
						<H4 className="text-danger">Delete Resource</H4>
					</div>
				</header>
			}
			footer={
				<div className="flex items-center justify-end gap-3">
					<Button
						variant="primary"
						size="sm"
						onPress={() => modalRef.current?.close()}
					>
						Close
					</Button>
					<Button
						variant="danger"
						size="sm"
						isPending={isPending}
						isDisabled={isPending}
						onPress={async () => {
							await deleteResource(resource.id);
							modalRef.current?.close();
						}}
					>
						Delete
					</Button>
				</div>
			}
		>
			<div className="flex flex-col items-start justify-start space-y-4">
				<p className="text-sm font-normal text-muted">
					Are you sure you want to delete {resource.name}?
				</p>
				<p className="text-danger text-sm">
					This action is not reversible and you won't be able to retrieve the
					resource data in the future.
				</p>
			</div>
		</Modal>
	);
};
