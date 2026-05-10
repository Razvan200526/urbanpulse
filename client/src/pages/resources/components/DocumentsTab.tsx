import { ProgressChip } from "@client/components/chips/ProgressChip";
import { Modal } from "@client/components/Modal";
import { H3, P } from "@client/components/typography";
import { normalizeAssetUrl } from "@client/utils/normalizeAssetUrl";
import { Chip, ScrollShadow, Toast } from "@heroui/react";
import {
	type LostDocumentTypeEnum,
	PetAlertUploadStatusEnum,
} from "@shared/types";
import { BadgeCheck, CalendarDays, MapPin, ShieldAlert } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
	type LostDocumentPreview,
	useLostDocumentMatches,
	useMyLostDocuments,
	usePublicLostDocuments,
	useUploadLostDocument,
} from "../hooks/useLostDocuments";
import { LostDocumentUploader } from "./LostDocumentUploader";

type TransientUploadItem = {
	requestId: string;
	documentId: string | null;
	status: PetAlertUploadStatusEnum;
	createdAt: Date;
	error?: string;
};

type PersistedDocumentCard = {
	id: string;
	createdAt: Date;
	documentType: LostDocumentTypeEnum;
	extractedCity: string | null;
	blurredImageUrl: string;
	isOwn: boolean;
	status: PetAlertUploadStatusEnum.Success | null;
};

type TransientDocumentCard = {
	id: string;
	createdAt: Date;
	isOwn: true;
	status:
		| PetAlertUploadStatusEnum.Pending
		| PetAlertUploadStatusEnum.Processing
		| PetAlertUploadStatusEnum.Failed;
	error?: string;
};

type DocumentPreviewState = {
	url: string;
	alt: string;
	title: string;
};

const documentTypeLabels: Record<LostDocumentTypeEnum, string> = {
	ID_CARD: "ID Card",
	PASSPORT: "Passport",
	DRIVING_LICENSE: "Driver License",
	STUDENT_CARD: "Student Card",
	HEALTH_CARD: "Health Card",
	OTHER: "Other",
};

const statusLabels: Record<PetAlertUploadStatusEnum, string> = {
	[PetAlertUploadStatusEnum.Pending]: "Uploading",
	[PetAlertUploadStatusEnum.Processing]: "Uploading",
	[PetAlertUploadStatusEnum.Success]: "Success",
	[PetAlertUploadStatusEnum.Failed]: "Failed",
};

const toPersistedCard = (
	document: LostDocumentPreview,
	isOwn: boolean,
): PersistedDocumentCard => ({
	id: document.id,
	createdAt: document.createdAt,
	documentType: document.documentType,
	extractedCity: document.extractedCity,
	blurredImageUrl: document.blurredImageUrl,
	isOwn,
	status: isOwn ? PetAlertUploadStatusEnum.Success : null,
});

export const DocumentsTab = () => {
	const { mutateAsync: uploadDocument, isPending: isUploading } =
		useUploadLostDocument();
	const { data: myDocuments = [], isLoading: isMyDocumentsLoading } =
		useMyLostDocuments();
	const { data: publicDocuments = [], isLoading: isPublicDocumentsLoading } =
		usePublicLostDocuments();
	const { data: matches = [] } = useLostDocumentMatches();
	const [transientUploads, setTransientUploads] = useState<
		TransientUploadItem[]
	>([]);
	const [previewDocument, setPreviewDocument] =
		useState<DocumentPreviewState | null>(null);
	const seenMatchIdsRef = useRef<Set<string> | null>(null);

	useEffect(() => {
		setTransientUploads((current) =>
			current.filter((item) => {
				if (!item.documentId) {
					return true;
				}

				return !myDocuments.some((document) => document.id === item.documentId);
			}),
		);
	}, [myDocuments]);

	useEffect(() => {
		const currentIds = new Set(matches.map((match) => match.matchId));
		const previousIds = seenMatchIdsRef.current;

		if (!previousIds) {
			seenMatchIdsRef.current = currentIds;
			return;
		}

		const newlyMatched = matches.filter(
			(match) => !previousIds.has(match.matchId),
		);
		if (newlyMatched.length > 0) {
			if (newlyMatched.length === 1) {
				const single = newlyMatched[0];
				Toast.toast.success(
					`Potential document match found (${Math.round(single.matchScore * 100)}% confidence).`,
				);
			} else {
				Toast.toast.success(
					`${newlyMatched.length} new potential document matches were found.`,
				);
			}
		}

		seenMatchIdsRef.current = currentIds;
	}, [matches]);

	const ownDocumentIds = useMemo(
		() => new Set(myDocuments.map((document) => document.id)),
		[myDocuments],
	);

	const persistedCards = useMemo(() => {
		const cardsById = new Map<string, PersistedDocumentCard>();

		for (const document of publicDocuments) {
			cardsById.set(
				document.id,
				toPersistedCard(document, ownDocumentIds.has(document.id)),
			);
		}

		for (const document of myDocuments) {
			cardsById.set(document.id, toPersistedCard(document, true));
		}

		return [...cardsById.values()];
	}, [myDocuments, ownDocumentIds, publicDocuments]);

	const transientCards = useMemo<TransientDocumentCard[]>(
		() =>
			transientUploads.map((item) => ({
				id: item.requestId,
				createdAt: item.createdAt,
				isOwn: true,
				status: item.status as
					| PetAlertUploadStatusEnum.Pending
					| PetAlertUploadStatusEnum.Processing
					| PetAlertUploadStatusEnum.Failed,
				error: item.error,
			})),
		[transientUploads],
	);

	const cards = useMemo(
		() =>
			[...transientCards, ...persistedCards].sort(
				(a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
			),
		[persistedCards, transientCards],
	);

	const isLoading = isMyDocumentsLoading || isPublicDocumentsLoading;
	const isPreviewOpen = previewDocument !== null;
	const skeletonIds = ["skeleton-1", "skeleton-2", "skeleton-3"];

	return (
		<>
			<div className="flex h-[calc(100dvh-9rem)] w-full min-w-0 flex-col gap-4 p-4 sm:p-6">
				<div className="flex items-center justify-between px-4 py-3">
					<div className="flex flex-col items-start">
						<div className="flex items-center justify-center gap-2">
							<H3>All uploaded documents</H3>
							<Chip className="bg-surface border border-accent rounded-full text-accent">
								<Chip.Label>
									{" "}
									{publicDocuments.length + myDocuments.length}
								</Chip.Label>
							</Chip>
						</div>
						<P className="text-sm">Find yours here!</P>
					</div>
					<LostDocumentUploader
						isUploading={isUploading}
						onUpload={async (file) => {
							const requestId = crypto.randomUUID();
							setTransientUploads((current) => [
								{
									requestId,
									documentId: null,
									status: PetAlertUploadStatusEnum.Pending,
									createdAt: new Date(),
								},
								...current,
							]);

							try {
								const response = await uploadDocument(file);
								setTransientUploads((current) =>
									current.map((item) =>
										item.requestId === requestId
											? {
													...item,
													documentId: response.documentId,
													status: PetAlertUploadStatusEnum.Processing,
												}
											: item,
									),
								);
							} catch (error) {
								setTransientUploads((current) =>
									current.map((item) =>
										item.requestId === requestId
											? {
													...item,
													status: PetAlertUploadStatusEnum.Failed,
													error:
														error instanceof Error
															? error.message
															: "Upload failed.",
												}
											: item,
									),
								);
							}
						}}
					/>
				</div>
				<ScrollShadow
					className="min-h-0 flex-1 border border-border bg-surface p-4 sm:p-6"
					size={10}
				>
					<div className="space-y-4">
						{isLoading ? (
							<div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
								{skeletonIds.map((skeletonId) => (
									<div
										key={skeletonId}
										className="h-72 animate-pulse border border-border bg-surface-secondary/30"
									/>
								))}
							</div>
						) : cards.length > 0 ? (
							<div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
								{cards.map((card) => {
									const isTransient = !("blurredImageUrl" in card);
									const showStatus = card.isOwn && card.status !== null;
									const documentTitle = isTransient
										? "Document Upload"
										: (documentTypeLabels[card.documentType] ?? "Document");

									return (
										<article
											key={card.id}
											className="overflow-hidden border border-border bg-surface"
										>
											<div className="relative h-44 w-full overflow-hidden bg-surface-secondary/50">
												{isTransient ? (
													card.status === PetAlertUploadStatusEnum.Failed ? (
														<div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[linear-gradient(135deg,rgba(255,255,255,0.02),rgba(255,255,255,0.08))] text-muted">
															<ShieldAlert className="size-6 text-warning" />
															<span className="text-xs font-medium">
																Privacy-safe placeholder
															</span>
														</div>
													) : (
														<div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.02),rgba(255,255,255,0.08))]" />
													)
												) : (
													<button
														type="button"
														className="group relative block h-full w-full cursor-zoom-in"
														onClick={() =>
															setPreviewDocument({
																url: card.blurredImageUrl,
																alt: `${card.documentType} preview`,
																title: documentTitle,
															})
														}
														aria-label={`Inspect ${documentTitle}`}
													>
														<img
															src={normalizeAssetUrl(card.blurredImageUrl)}
															alt={`${card.documentType} preview`}
															className="h-full w-full object-cover transition duration-200 group-hover:scale-[1.02]"
														/>
														<span className="pointer-events-none absolute right-2 bottom-2 rounded border border-border bg-surface/90 px-2 py-1 text-[11px] font-medium text-muted backdrop-blur">
															Inspect
														</span>
													</button>
												)}
												{showStatus ? (
													<div className="absolute top-3 left-3">
														<ProgressChip
															size="sm"
															status={
																card.status ?? PetAlertUploadStatusEnum.Success
															}
															label={
																statusLabels[
																	card.status ??
																		PetAlertUploadStatusEnum.Success
																]
															}
														/>
													</div>
												) : null}
											</div>

											<div className="space-y-2 p-4">
												<p className="flex items-center gap-2 text-sm font-medium text-foreground">
													<BadgeCheck className="size-4 text-accent" />
													{documentTitle}
												</p>
												<p className="flex items-center gap-2 text-xs text-muted">
													<MapPin className="size-4" />
													{isTransient
														? "City will appear after processing"
														: card.extractedCity || "Unknown city"}
												</p>
												<p className="flex items-center gap-2 text-xs text-muted">
													<CalendarDays className="size-4" />
													{card.createdAt.toLocaleString()}
												</p>
												{isTransient &&
												card.status === PetAlertUploadStatusEnum.Failed ? (
													<p className="text-xs text-danger">
														{card.error || "Upload failed."}
													</p>
												) : null}
											</div>
										</article>
									);
								})}
							</div>
						) : (
							<div className="border border-dashed border-border bg-surface-secondary/20 px-5 py-8 text-center text-sm text-muted">
								No document uploads yet.
							</div>
						)}
					</div>
				</ScrollShadow>
			</div>
			<Modal
				isOpen={isPreviewOpen}
				onOpenChange={(open) => {
					if (!open) {
						setPreviewDocument(null);
					}
				}}
				backdrop="blur"
				size="full"
				placement="center"
				header={previewDocument?.title ?? "Document preview"}
				bodyClassName="flex items-center justify-center bg-surface-secondary/40 p-4 sm:p-8"
				trigger={<div />}
			>
				{previewDocument ? (
					<img
						src={normalizeAssetUrl(previewDocument.url)}
						alt={previewDocument.alt}
						className="max-h-[75dvh] w-auto max-w-full rounded border border-border object-contain shadow-xl"
					/>
				) : null}
			</Modal>
		</>
	);
};
