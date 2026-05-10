import { normalizeAssetUrl } from "@client/utils/normalizeAssetUrl";
import type { LostDocumentTypeEnum } from "@shared/types";
import { BadgeCheck, CalendarDays, MapPin } from "lucide-react";
import type { LostDocumentPreview } from "../hooks/useLostDocuments";

const documentTypeLabels: Record<LostDocumentTypeEnum, string> = {
	ID_CARD: "ID Card",
	PASSPORT: "Passport",
	DRIVING_LICENSE: "Driver License",
	STUDENT_CARD: "Student Card",
	HEALTH_CARD: "Health Card",
	OTHER: "Other",
};

type LostDocumentsGridProps = {
	title: string;
	subtitle: string;
	documents: LostDocumentPreview[];
	isLoading: boolean;
	emptyMessage: string;
};

export const LostDocumentsGrid = ({
	title,
	subtitle,
	documents,
	isLoading,
	emptyMessage,
}: LostDocumentsGridProps) => {
	const skeletonIds = ["skeleton-1", "skeleton-2", "skeleton-3"];

	return (
		<section className="space-y-3">
			<div>
				<h3 className="text-base font-semibold text-foreground">{title}</h3>
				<p className="text-sm text-muted">{subtitle}</p>
			</div>

			{isLoading ? (
				<div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
					{skeletonIds.map((skeletonId) => (
						<div
							key={skeletonId}
							className="h-72 animate-pulse rounded border border-border bg-surface-secondary/40"
						/>
					))}
				</div>
			) : documents.length > 0 ? (
				<div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
					{documents.map((document) => (
						<article
							key={document.id}
							className="overflow-hidden rounded border border-border bg-surface"
						>
							<img
								src={normalizeAssetUrl(document.blurredImageUrl)}
								alt={`${document.documentType} preview`}
								className="h-44 w-full object-cover"
							/>
							<div className="space-y-2 p-4">
								<p className="flex items-center gap-2 text-sm font-medium text-foreground">
									<BadgeCheck className="size-4 text-accent" />
									{documentTypeLabels[document.documentType] ?? "Document"}
								</p>
								<p className="flex items-center gap-2 text-xs text-muted">
									<MapPin className="size-4" />
									{document.extractedCity || "Unknown city"}
								</p>
								<p className="flex items-center gap-2 text-xs text-muted">
									<CalendarDays className="size-4" />
									{document.createdAt.toLocaleString()}
								</p>
							</div>
						</article>
					))}
				</div>
			) : (
				<div className="rounded border border-dashed border-border bg-surface-secondary/20 px-5 py-8 text-center text-sm text-muted">
					{emptyMessage}
				</div>
			)}
		</section>
	);
};
