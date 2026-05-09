import type { ClientPulseType } from "@client/utils/types";
import { PulseEnum, PulseStatusEnum, UrgencyEnum } from "@shared/types";
import { formatDate } from "@shared/utils/formatDate";
import { AlertTriangle, PackageIcon, Wrench } from "lucide-react";
import { Link } from "react-router";

function urgencyLabel(u: UrgencyEnum | string): string {
	if (u === UrgencyEnum.Immediate) return "Immediate";
	if (u === UrgencyEnum.Urgent) return "Urgent";
	if (u === UrgencyEnum.NotUrgent) return "Not urgent";
	return "Unknown";
}
function TypeIcon({ type }: { type: PulseEnum }) {
	if (type === PulseEnum.Emergency)
		return <AlertTriangle className="size-4 text-danger" />;
	if (type === PulseEnum.Skill)
		return <Wrench className="size-4 text-accent" />;
	return <PackageIcon className="size-4 text-primary" />;
}

type PulseListItem = Omit<ClientPulseType, "createdAt"> & {
	createdAt: string | Date;
};

export const PulseList = ({ pulses }: { pulses: PulseListItem[] }) => {
	return pulses.map((pulse: PulseListItem) => (
		<Link
			key={pulse.id}
			to="/map"
			className="flex gap-3 rounded-lg border border-border/60 bg-surface/40 p-3 transition-colors hover:border-accent/40 hover:bg-surface/70"
		>
			<div className="mt-0.5 shrink-0">
				<TypeIcon type={pulse.type as PulseEnum} />
			</div>
			<div className="min-w-0 flex-1">
				<div className="flex flex-wrap items-center gap-2">
					<span className="font-semibold text-accent text-sm truncate">
						{pulse.title}
					</span>
					<span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded border border-border text-muted">
						{urgencyLabel(pulse.urgency)}
					</span>
					{pulse.status !== PulseStatusEnum.Active && (
						<span className="text-[10px] uppercase text-muted">
							{pulse.status}
						</span>
					)}
					{pulse.isVerified && (
						<span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded border border-success/40 text-success">
							Verified
						</span>
					)}
				</div>
				{pulse.description ? (
					<p className="text-xs text-muted line-clamp-2 mt-1">
						{pulse.description}
					</p>
				) : null}
				<p className="text-[11px] text-muted mt-1.5">
					{formatDate(pulse.createdAt)} · {pulse.type}
					{pulse.incidentType ? ` · ${pulse.incidentType.label}` : ""}
				</p>
			</div>
		</Link>
	));
};
