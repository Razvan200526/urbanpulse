type LostDocumentMatch = {
	matchId: string;
	documentId: string;
	matchScore: number;
	potentialOwner: {
		id: string;
		name: string;
		email: string;
	};
	nameMatch: boolean;
	birthYearMatch: boolean;
	cityMatch: boolean;
};

type LostDocumentMatchesPanelProps = {
	matches: LostDocumentMatch[];
	isLoading: boolean;
};

export const LostDocumentMatchesPanel = ({
	matches,
	isLoading,
}: LostDocumentMatchesPanelProps) => {
	return (
		<section className="space-y-3">
			<div>
				<h3 className="text-base font-semibold text-foreground">
					Potential Owner Matches
				</h3>
				<p className="text-sm text-muted">
					Matches are based on partial fields and similarity scoring.
				</p>
			</div>

			{isLoading ? (
				<div className="rounded border border-border bg-surface p-4 text-sm text-muted">
					Loading matches...
				</div>
			) : matches.length > 0 ? (
				<div className="space-y-3">
					{matches.map((match) => (
						<article
							key={match.matchId}
							className="rounded border border-border bg-surface p-4"
						>
							<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
								<p className="text-sm font-semibold text-foreground">
									{match.potentialOwner.name}
								</p>
								<p className="text-sm text-accent">
									{Math.round(match.matchScore * 100)}% confidence
								</p>
							</div>
							<p className="text-xs text-muted">{match.potentialOwner.email}</p>
							<div className="mt-3 flex flex-wrap gap-2 text-xs">
								<span className="rounded bg-surface-secondary px-2 py-1">
									Name: {match.nameMatch ? "yes" : "no"}
								</span>
								<span className="rounded bg-surface-secondary px-2 py-1">
									Birth year: {match.birthYearMatch ? "yes" : "no"}
								</span>
								<span className="rounded bg-surface-secondary px-2 py-1">
									City: {match.cityMatch ? "yes" : "no"}
								</span>
							</div>
						</article>
					))}
				</div>
			) : (
				<div className="rounded border border-dashed border-border bg-surface-secondary/20 px-5 py-8 text-center text-sm text-muted">
					No matches yet. Uploaded documents will be continuously evaluated as
					new reports come in.
				</div>
			)}
		</section>
	);
};
