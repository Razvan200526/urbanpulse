import { AppDrawer } from "@client/components/AppDrawer";
import { Button } from "@client/components/Button/Button";
import { AvailabilityChip } from "@client/components/chips/AvaiabilityChip";
import type { ModalRefType } from "@client/components/Modal";
import { Avatar } from "@client/components/user/Avatar";
import { useAuth } from "@client/hooks/useAuth";
import { MetaRow } from "@client/pages/map/components/MetaRow";
import { normalizeAssetUrl } from "@client/utils/normalizeAssetUrl";
import type { ClientUserType } from "@client/utils/types";
import { Chip, Drawer } from "@heroui/react";
import { TransactionStatusEnum } from "@shared/types";
import { formatDate } from "@shared/utils/formatDate";
import { ClockIcon, PackageIcon } from "lucide-react";
import { useRef, useState } from "react";
import type { ResourceWithUsersType } from "../../hooks";
import {
	useCompleteResourceTransaction,
	useGetPendingRequests,
	useGetResourceTransaction,
	useRequestBorrow,
	useRespondToRequest,
} from "../../hooks";
import { ResourceReviewModal } from "../ResourceReviewModal";

interface ResourceDetailsDrawerProps {
	item: ResourceWithUsersType;
	author?: ClientUserType;
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
}

type ResourceImageShowcaseProps = {
	imageUrls: string[];
	resourceName: string;
};

const ResourceImageShowcase = ({
	imageUrls,
	resourceName,
}: ResourceImageShowcaseProps) => {
	if (imageUrls.length === 0) {
		return (
			<div className="rounded border border-border bg-surface p-4">
				<p className="mb-2 text-sm font-semibold text-accent">Photos</p>
				<p className="text-sm italic text-muted">No photos added.</p>
			</div>
		);
	}

	const [primaryImage, ...supportingImages] = imageUrls;

	return (
		<div className="rounded border border-border bg-surface p-4">
			<div className="mb-3 flex items-center justify-between gap-3">
				<p className="text-sm font-semibold text-accent">Photos</p>
				<span className="text-xs text-muted">
					{imageUrls.length} {imageUrls.length === 1 ? "photo" : "photos"}
				</span>
			</div>

			<div className="overflow-hidden rounded border border-border bg-surface-secondary">
				<img
					src={normalizeAssetUrl(primaryImage)}
					alt={`${resourceName} view 1`}
					className="aspect-4/3 w-full object-cover"
					loading="lazy"
				/>
			</div>

			{supportingImages.length > 0 && (
				<div className="mt-2 grid grid-cols-3 gap-2">
					{supportingImages.map((url, index) => (
						<div
							key={`${url}:${index.toString()}`}
							className="overflow-hidden rounded border border-border bg-surface-secondary"
						>
							<img
								src={normalizeAssetUrl(url)}
								alt={`${resourceName} view ${index + 2}`}
								className="aspect-square w-full object-cover"
								loading="lazy"
							/>
						</div>
					))}
				</div>
			)}
		</div>
	);
};

export function ResourceDetailsDrawer({
	item,
	author,
	isOpen,
	onOpenChange,
}: ResourceDetailsDrawerProps) {
	const { resource, recentUsers } = item;
	const { data: user } = useAuth();
	const userId = user?.user.id || "";
	const isOwner = resource.userId === userId;
	const reviewModalRef = useRef<ModalRefType>(null);
	const [reviewTransactionId, setReviewTransactionId] = useState<string | null>(
		null,
	);
	const { mutate: requestBorrow, isPending } = useRequestBorrow(userId);
	const { data: pendingRequests = [] } = useGetPendingRequests(
		isOwner ? userId : "",
	);
	const { mutateAsync: respondToRequest, isPending: isResponding } =
		useRespondToRequest(userId);
	const { data: myTransaction, isLoading: isTransactionLoading } =
		useGetResourceTransaction(resource.id, !isOwner ? userId : "");
	const {
		mutateAsync: completeTransaction,
		isPending: isCompletingTransaction,
	} = useCompleteResourceTransaction(userId);
	const resourcePendingRequests = pendingRequests.filter(
		(request) => request.resource?.id === resource.id,
	);

	const handleRequestBorrow = () => {
		if (!userId) return;
		requestBorrow({ resourceId: resource.id, borrowerId: userId });
		onOpenChange(false);
	};

	const handleRespondToRequest = async (
		transactionId: string,
		accept: boolean,
	) => {
		await respondToRequest({ transactionId, accept });
	};

	const handleCompleteTransaction = async () => {
		if (!myTransaction) return;
		const completed = await completeTransaction({
			transactionId: myTransaction.id,
			resourceId: resource.id,
		});
		setReviewTransactionId(completed?.id ?? myTransaction.id);
		reviewModalRef.current?.open();
	};

	const handleOpenReview = () => {
		if (!myTransaction) return;
		setReviewTransactionId(myTransaction.id);
		reviewModalRef.current?.open();
	};

	const renderBorrowerAction = () => {
		if (isOwner) return null;

		if (!userId) {
			return (
				<Button variant="primary" isDisabled>
					Sign in to borrow
				</Button>
			);
		}

		if (isTransactionLoading) {
			return (
				<Button variant="primary" isDisabled>
					Checking request...
				</Button>
			);
		}

		if (myTransaction?.status === TransactionStatusEnum.Pending) {
			return (
				<Button variant="primary" isDisabled>
					Request pending
				</Button>
			);
		}

		if (myTransaction?.status === TransactionStatusEnum.Active) {
			return (
				<Button
					variant="primary"
					onPress={handleCompleteTransaction}
					isPending={isCompletingTransaction}
				>
					Mark as done
				</Button>
			);
		}

		if (myTransaction?.status === TransactionStatusEnum.Completed) {
			return (
				<Button variant="primary" onPress={handleOpenReview}>
					Leave review
				</Button>
			);
		}

		if (resource.availability !== "Available") {
			return (
				<Button variant="primary" isDisabled>
					Unavailable
				</Button>
			);
		}

		return (
			<Button
				variant="primary"
				onPress={handleRequestBorrow}
				isDisabled={isPending}
			>
				Request Borrow
			</Button>
		);
	};

	return (
		<>
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
							{renderBorrowerAction()}
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

					{isOwner && (
						<div className="rounded border border-border bg-surface p-4">
							<p className="mb-3 text-sm font-semibold text-accent">
								Pending requests
							</p>
							{resourcePendingRequests.length > 0 ? (
								<div className="flex flex-col gap-3">
									{resourcePendingRequests.map((request) => (
										<div
											key={request.transaction.id}
											className="flex flex-col gap-3 border-b border-border pb-3 last:border-b-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
										>
											<div className="flex items-center gap-3">
												<Avatar user={request.borrower} />
												<p className="text-sm font-medium">
													{request.borrower?.name || "Unknown borrower"}
												</p>
											</div>
											<div className="flex items-center gap-2">
												<Button
													size="sm"
													variant="danger-soft"
													isPending={isResponding}
													onPress={() =>
														handleRespondToRequest(
															request.transaction.id,
															false,
														)
													}
												>
													Reject
												</Button>
												<Button
													size="sm"
													variant="primary"
													isPending={isResponding}
													onPress={() =>
														handleRespondToRequest(request.transaction.id, true)
													}
												>
													Accept
												</Button>
											</div>
										</div>
									))}
								</div>
							) : (
								<p className="text-sm text-muted">No pending requests.</p>
							)}
						</div>
					)}

					<div className="rounded border border-border bg-surface px-4">
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
					<ResourceImageShowcase
						imageUrls={resource.imageUrls}
						resourceName={resource.name}
					/>
				</div>
			</AppDrawer>
			<ResourceReviewModal
				modalRef={reviewModalRef}
				transactionId={reviewTransactionId}
				resourceId={resource.id}
				onSubmitted={() => setReviewTransactionId(null)}
			/>
		</>
	);
}
