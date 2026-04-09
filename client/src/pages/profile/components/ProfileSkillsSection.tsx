import { Button } from "@client/components/Button/Button";
import { Chip } from "@heroui/react";
import { HandHelping, ShieldCheck, X } from "lucide-react";

export const ProfileSkillsSection = ({
	skillTags,
	draftTag,
	isSavingTags,
	onDraftTagChange,
	onAddSkillTag,
	onRemoveSkillTag,
	onSaveSkillTags,
}: {
	skillTags: string[];
	draftTag: string;
	isSavingTags: boolean;
	onDraftTagChange: (value: string) => void;
	onAddSkillTag: () => void;
	onRemoveSkillTag: (tag: string) => void;
	onSaveSkillTags: () => Promise<void>;
}) => {
	return (
		<div className="space-y-3 border-t border-border pt-6">
			<div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
				<p className="text-sm font-semibold text-accent">Skills</p>
				<p className="text-sm text-muted">
					Keep these current so neighbours can find the right help faster.
				</p>
			</div>

			<div className="flex flex-wrap gap-2">
				{skillTags.length > 0 ? (
					skillTags.map((tag) => (
						<Chip
							key={tag}
							color="accent"
							variant="soft"
							className="max-w-full rounded border border-accent/30 bg-accent/10 px-2 py-1 shadow-none"
						>
							<Chip.Label className="flex max-w-full items-center gap-2">
								<span className="flex min-w-0 items-center gap-1.5">
									<HandHelping className="size-3 shrink-0" />
									<span className="truncate text-sm">{tag}</span>
								</span>
								<button
									type="button"
									aria-label={`Remove ${tag} skill`}
									className="inline-flex size-6 shrink-0 items-center justify-center rounded border border-accent/20 text-muted transition-colors hover:border-danger/40 hover:text-danger"
									onClick={() => onRemoveSkillTag(tag)}
								>
									<X className="size-3.5" />
								</button>
							</Chip.Label>
						</Chip>
					))
				) : (
					<p className="text-sm text-muted">No skill tags added yet.</p>
				)}
			</div>

			<div className="rounded border border-border bg-surface-secondary/20 p-3 sm:p-4">
				<div className="flex flex-col gap-3">
					<input
						value={draftTag}
						onChange={(e) => onDraftTagChange(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === "Enter") {
								e.preventDefault();
								onAddSkillTag();
							}
						}}
						className="h-11 w-full min-w-0 rounded border border-border bg-field-background px-3 text-sm text-field-foreground outline-none transition-colors focus:border-accent"
						placeholder="Add a skill tag like First Aid or Heavy Lifting"
					/>
					<div className="grid gap-2 sm:grid-cols-2">
						<Button
							size="sm"
							variant="secondary"
							className="w-full"
							onPress={onAddSkillTag}
						>
							Add skill
						</Button>
						<Button
							size="sm"
							variant="primary"
							className="w-full"
							onPress={onSaveSkillTags}
							isPending={isSavingTags}
							startContent={<ShieldCheck className="size-4" />}
						>
							Save skills
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
};
