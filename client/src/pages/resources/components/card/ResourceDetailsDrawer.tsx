import { Button } from "@client/components/Button/Button";
import { AvailabilityChip } from "@client/components/chips/AvaiabilityChip";
import { useIsMobile } from "@client/hooks/useMediaQuery";
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
	const isMobile = useIsMobile();
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
		<Drawer key="right">
			<div />
			<Drawer.Backdrop
				variant={isMobile ? "blur" : "transparent"}
				isOpen={isOpen}
				onOpenChange={onOpenChange}
			>
				<Drawer.Content
					className="overflow-hidden"
					placement={isMobile ? "bottom" : "right"}
				>
					<Drawer.Dialog
						className={cn(
							"relative flex overflow-hidden border border-accent bg-surface",
							isMobile
								? "max-h-[88dvh] rounded-t-[2rem] border-x-0 border-b-0"
								: "h-dvh w-[min(40rem,100vw)] rounded-l-[2rem] border-y-0 border-r-0",
						)}
					>
						{isMobile && (
							<Drawer.Handle className="mt-3 self-center bg-border" />
						)}
						<Drawer.CloseTrigger className="absolute top-4 right-4 z-10 rounded-full border border-border bg-surface-secondary/90 p-2 text-muted transition-colors duration-150 hover:text-foreground" />
						<Drawer.Header className="relative overflow-hidden border-b border-accent px-4 pt-5 pb-5 md:px-5 md:pt-4 md:pb-6">
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

						<Drawer.Body className="min-h-0 flex-1 overflow-y-auto px-4 pt-3 pb-8 md:px-5 md:pb-10">
							<div className="flex flex-col gap-4">
								<div className={`rounded bg-surface border border-border p-4`}>
									<p className="text-accent text-sm font-semibold mb-2">
										About
									</p>
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
												recentUsers.map(
													(
														user: Pick<ClientUserType, "id" | "name" | "image">,
													) => (
														<div
															key={user.id}
															className="flex items-center gap-2"
														>
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
						</Drawer.Body>
						<Drawer.Footer className="shrink-0 border-t border-border bg-surface/95 px-4 py-4 backdrop-blur md:px-5">
							<div
								className={cn(
									"flex w-full gap-3",
									isMobile ? "flex-col-reverse" : "items-center justify-end",
								)}
							>
								<Button
									variant="danger-soft"
									onPress={() => onOpenChange(false)}
								>
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
					</Drawer.Dialog>
				</Drawer.Content>
			</Drawer.Backdrop>
		</Drawer>
	);
}
