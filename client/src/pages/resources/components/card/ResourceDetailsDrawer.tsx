import { Button } from "@client/components/Button/Button";
import { AvailabilityChip } from "@client/components/chips/AvaiabilityChip";
import { Avatar } from "@client/components/user/Avatar";
import { useAuth } from "@client/hooks/useAuth";
import { MetaRow } from "@client/pages/map/components/MetaRow";
import type { ClientUserType } from "@client/utils/types";
import { Chip, cn, Drawer } from "@heroui/react";
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
		<Drawer isOpen={isOpen} onOpenChange={onOpenChange} key="right">
			<Drawer.Backdrop variant="transparent">
				<Drawer.Content className="overflow-hidden" placement="right">
					<Drawer.Dialog className="rounded-l">
						<Drawer.Header className="relative px-5 pt-4 pb-6 overflow-hidden border border-accent rounded">
							<div
								className={cn(
									"absolute inset-0 bg-linear-to-b pointer-events-none",
								)}
							/>
							<Drawer.Heading className="relative flex flex-col gap-3">
								<div className="flex items-center gap-2 flex-wrap">
									<Chip className="border border-accent bg-accent/5 gap-1 rounded-full">
										<PackageIcon className="size-4 text-accent" />
										<p className="text-accent">Resource</p>
									</Chip>
									<AvailabilityChip status={resource.availability} />
								</div>

								<p className="text-foreground leading-snug tracking-tight truncate">
									{resource.name}
								</p>

								<div className="flex items-center gap-4 text-xs text-muted">
									<span className="flex items-center gap-1">
										<ClockIcon className="size-3" />
										{formatDate(resource.createdAt)}
									</span>
								</div>
							</Drawer.Heading>
						</Drawer.Header>

						<Drawer.Body className="px-5 pt-3 pb-10 flex flex-col gap-4">
							<div className={`rounded bg-surface border border-border p-4`}>
								<p className="text-accent text-sm font-semibold mb-2">About</p>
								{resource.description ? (
									<p className="text-sm text-muted leading-relaxed">
										{resource.description}
									</p>
								) : (
									<p className="text-sm text-muted italic">
										No description provided.
									</p>
								)}
							</div>

							<div className={`rounded bg-surface border border-border px-4`}>
								<MetaRow label="Owner">
									<div className="flex items-center gap-3">
										<Avatar user={author} />
										<p className="text-sm font-medium">
											{author?.name || "Unknown"}
										</p>
									</div>
								</MetaRow>

								<MetaRow label="Borrowers">
									<div className="flex flex-wrap gap-2">
										{recentUsers && recentUsers.length > 0 ? (
											recentUsers.map((user) => (
												<div key={user.id} className="flex items-center gap-2">
													<Avatar user={user as ClientUserType} />
												</div>
											))
										) : (
											<span className="text-xs text-muted">None</span>
										)}
									</div>
								</MetaRow>
							</div>
						</Drawer.Body>
						<div className="flex items-center justify-end gap-3 mt-4">
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
					</Drawer.Dialog>
				</Drawer.Content>
			</Drawer.Backdrop>
		</Drawer>
	);
}
