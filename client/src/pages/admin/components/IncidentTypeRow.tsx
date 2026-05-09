import { Button } from "@client/components/Button/Button";
import type { ClientIncidentType } from "@client/hooks/useIncidentTypes";
import { Eye, EyeOff, Save } from "lucide-react";
import { useEffect, useState } from "react";

export const IncidentTypeRow = ({
	incidentType,
	isPending,
	onSave,
	onToggleActive,
}: {
	incidentType: ClientIncidentType;
	isPending: boolean;
	onSave: (
		incidentType: ClientIncidentType,
		payload: { label: string; description: string; sortOrder: number },
	) => void;
	onToggleActive: (incidentType: ClientIncidentType) => void;
}) => {
	const [label, setLabel] = useState(incidentType.label);
	const [description, setDescription] = useState(
		incidentType.description ?? "",
	);
	const [sortOrder, setSortOrder] = useState(String(incidentType.sortOrder));

	useEffect(() => {
		setLabel(incidentType.label);
		setDescription(incidentType.description ?? "");
		setSortOrder(String(incidentType.sortOrder));
	}, [incidentType]);

	const parsedSortOrder = Number(sortOrder);
	const canSave =
		label.trim().length > 0 &&
		Number.isFinite(parsedSortOrder) &&
		Number.isInteger(parsedSortOrder) &&
		(label.trim() !== incidentType.label ||
			description.trim() !== (incidentType.description ?? "") ||
			parsedSortOrder !== incidentType.sortOrder);

	return (
		<div className="rounded border border-accent/20 bg-surface-secondary/10 p-4">
			<div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(10rem,0.3fr)_auto] lg:items-end">
				<label className="flex min-w-0 flex-col gap-1.5 text-sm text-accent">
					Name
					<input
						value={label}
						onChange={(event) => setLabel(event.target.value)}
						className="h-10 rounded border border-accent/25 bg-surface px-3 text-sm text-foreground outline-none focus:border-accent"
					/>
				</label>
				<label className="flex min-w-0 flex-col gap-1.5 text-sm text-accent">
					Order
					<input
						value={sortOrder}
						inputMode="numeric"
						onChange={(event) => setSortOrder(event.target.value)}
						className="h-10 rounded border border-accent/25 bg-surface px-3 text-sm text-foreground outline-none focus:border-accent"
					/>
				</label>
				<div className="flex flex-col gap-2 sm:flex-row lg:justify-end">
					<Button
						size="sm"
						variant="primary"
						className="w-full sm:w-auto"
						startContent={<Save className="size-4" />}
						isDisabled={!canSave}
						isPending={isPending}
						onPress={() =>
							onSave(incidentType, {
								label: label.trim(),
								description: description.trim(),
								sortOrder: parsedSortOrder,
							})
						}
					>
						Save
					</Button>
					<Button
						size="sm"
						variant={incidentType.isActive ? "outline" : "secondary"}
						className="w-full sm:w-auto"
						startContent={
							incidentType.isActive ? (
								<EyeOff className="size-4" />
							) : (
								<Eye className="size-4" />
							)
						}
						isPending={isPending}
						onPress={() => onToggleActive(incidentType)}
					>
						{incidentType.isActive ? "Deactivate" : "Activate"}
					</Button>
				</div>
			</div>
			<label className="mt-3 flex flex-col gap-1.5 text-sm text-accent">
				Description
				<textarea
					value={description}
					onChange={(event) => setDescription(event.target.value)}
					rows={2}
					className="rounded border border-accent/25 bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
				/>
			</label>
			<div className="mt-3 flex flex-wrap gap-2 text-xs text-muted">
				<span>{incidentType.slug}</span>
				<span>{incidentType.isSystem ? "System" : "Custom"}</span>
				<span>{incidentType.isActive ? "Active" : "Inactive"}</span>
			</div>
		</div>
	);
};
