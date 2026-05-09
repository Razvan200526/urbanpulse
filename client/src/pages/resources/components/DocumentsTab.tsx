import {
	useLostDocumentMatches,
	useMyLostDocuments,
	usePublicLostDocuments,
	useUploadLostDocument,
} from "../hooks/useLostDocuments";
import { LostDocumentMatchesPanel } from "./LostDocumentMatchesPanel";
import { LostDocumentsGrid } from "./LostDocumentsGrid";
import { LostDocumentUploader } from "./LostDocumentUploader";

export const DocumentsTab = () => {
	const { mutateAsync: uploadDocument, isPending: isUploading } =
		useUploadLostDocument();
	const { data: myDocuments = [], isLoading: isMyDocumentsLoading } =
		useMyLostDocuments();
	const { data: publicDocuments = [], isLoading: isPublicDocumentsLoading } =
		usePublicLostDocuments();
	const { data: matches = [], isLoading: isMatchesLoading } =
		useLostDocumentMatches();

	return (
		<div className="space-y-6">
			<LostDocumentUploader
				isUploading={isUploading}
				onUpload={async (file) => {
					await uploadDocument(file);
				}}
			/>

			<LostDocumentMatchesPanel
				matches={matches}
				isLoading={isMatchesLoading}
			/>

			<LostDocumentsGrid
				title="Community Document Feed"
				subtitle="Browse blurred previews uploaded by other citizens."
				documents={publicDocuments}
				isLoading={isPublicDocumentsLoading}
				emptyMessage="No community document uploads yet."
			/>

			<LostDocumentsGrid
				title="My Uploads"
				subtitle="Track your submitted documents and matching eligibility."
				documents={myDocuments}
				isLoading={isMyDocumentsLoading}
				emptyMessage="You have not uploaded any documents yet."
			/>
		</div>
	);
};
