import { AppDrawer } from "@client/components/AppDrawer";
import { Button } from "@client/components/Button/Button";
import { AvailabilityChip } from "@client/components/chips/AvaiabilityChip";
import { Avatar } from "@client/components/user/Avatar";
import { useAuth } from "@client/hooks/useAuth";
import { MetaRow } from "@client/pages/map/components/MetaRow";
import type { ClientUserType } from "@client/utils/types";
import { Chip, Drawer } from "@heroui/react";
import { formatDate } from "@shared/utils/formatDate";
import { ClockIcon, PackageIcon } from "lucide-react";
import type { ResourceWithUsersType } from "../../hooks";
import { useRequestBorrow } from "../../hooks";

interface ResourceDetailsDrawerProps {
	item: ResourceWithUsersType;
	author?: ClientUserType;
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
}

export function ResourceDetailsDrawer({
	item,
	author,
	isOpen,
	onOpenChange,
}: ResourceDetailsDrawerProps) {
	const { resource, recentUsers } = item;
	const { data: user } = useAuth();
	const { mutate: requestBorrow, isPending } = useRequestBorrow(
		user?.user.id || "",
	);

	const handleRequestBorrow = () => {
		if (!user?.user.id) return;
		requestBorrow({ resourceId: resource.id, borrowerId: user.user.id });
		onOpenChange(false);
	};

	return (
		<AppDrawer
			isOpen={isOpen}
			onOpenChange={onOpenChange}
			backdrop="blur"
			header={
				<div className="relative overflow-hidden border-b border-accent px-4 pt-5 pb-5 md:px-5 md:pt-4 md:pb-6">
					<div className="pointer-events-none absolute inset-0 bg-linear-to-b" />
					<div className="relative flex flex-col gap-3">
						<div className="flex flex-wrap items-center gap-2">
							<Chip className="gap-1 rounded-full border border-accent bg-accent/5">
								<PackageIcon className="size-4 text-accent" />
								<p className="text-accent">Resource</p>
							</Chip>
							<AvailabilityChip status={resource.availability} />
						</div>

						<p className="truncate leading-snug tracking-tight text-foreground">
							{resource.name}
						</p>

						<div className="flex items-center gap-4 text-xs text-muted">
							<span className="flex items-center gap-1">
								<ClockIcon className="size-3" />
								{formatDate(resource.createdAt)}
							</span>
						</div>
					</div>
				</div>
			}
			footer={
				<Drawer.Footer className="shrink-0 border-t border-border bg-surface/95 px-4 py-4 backdrop-blur md:px-5">
					<div className="flex w-full flex-col-reverse gap-3 md:flex-row md:items-center md:justify-end">
						<Button variant="danger-soft" onPress={() => onOpenChange(false)}>
							Close
						</Button>
						{resource.userId !== user?.user.id && (
							<Button
								variant="primary"
								onPress={handleRequestBorrow}
								isDisabled={isPending}
							>
								Request Borrow
							</Button>
						)}
					</div>
				</Drawer.Footer>
			}
			dialogClassName="w-full md:w-[min(40rem,100vw)] border-accent"
			bodyClassName="min-h-0 flex-1 overflow-y-auto px-4 pt-3 pb-8 md:px-5 md:pb-10"
			trigger={<div />}
		>
			<div className="flex flex-col gap-4">
				<div className="rounded border border-border bg-surface p-4">
					<p className="mb-2 text-sm font-semibold text-accent">About</p>
					{resource.description ? (
						<p className="text-sm leading-relaxed text-muted">
							{resource.description}
						</p>
					) : (
						<p className="text-sm italic text-muted">
							No description provided.
						</p>
					)}
				</div>

				<div className="rounded border border-border bg-surface px-4">
					<MetaRow label="Owner">
						<div className="flex items-center gap-3">
							<Avatar user={author} />
							<p className="text-sm font-medium">{author?.name || "Unknown"}</p>
						</div>
					</MetaRow>

					<MetaRow label="Borrowers">
						<div className="flex flex-wrap gap-2">
							{recentUsers && recentUsers.length > 0 ? (
								recentUsers.map(
									(user: Pick<ClientUserType, "id" | "name" | "image">) => (
										<div key={user.id} className="flex items-center gap-2">
											<Avatar user={user as ClientUserType} />
										</div>
									),
								)
							) : (
								<span className="text-xs text-muted">None</span>
							)}
						</div>
					</MetaRow>
				</div>
			</div>
		</AppDrawer>
	);
}
