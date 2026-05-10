import { H3, P } from "@client/components/typography";
import { Card, Separator } from "@heroui/react";
import { PulseEnum } from "@shared/types";
import {
	AlertCircle,
	AlertTriangle,
	Gauge,
	Package,
	PawPrint,
	Signal,
	Users,
	Zap,
} from "lucide-react";

interface ClusterCardProps {
	id: string;
	title: string;
	pulseType: string;
	reports: number;
	confidence: number;
	radius: string;
	isCrisis: boolean;
	status: "active" | "crisis" | "resolved";
	onClick?: (clusterId: string) => void;
}

const typeIconConfig: Record<
	string,
	{ Icon: React.FC<{ className?: string }>; color: string; label: string }
> = {
	[PulseEnum.Emergency]: {
		Icon: AlertCircle,
		color: "text-red-500",
		label: "Emergency",
	},
	[PulseEnum.Skill]: {
		Icon: Zap,
		color: "text-blue-500",
		label: "Skill Request",
	},
	[PulseEnum.Item]: {
		Icon: Package,
		color: "text-green-500",
		label: "Item Need",
	},
	[PulseEnum.PetAlert]: {
		Icon: PawPrint,
		color: "text-secondary",
		label: "Pet Alert",
	},
};

const statusConfig: Record<
	string,
	{ color: string; bg: string; label: string; icon: React.FC }
> = {
	active: {
		color: "bg-blue-100 text-blue-700",
		bg: "border-blue-200",
		label: "Active",
		icon: Signal,
	},
	crisis: {
		color: "bg-yellow-100 text-yellow-700",
		bg: "border-yellow-200",
		label: "CRISIS MODE",
		icon: AlertTriangle,
	},
	resolved: {
		color: "bg-green-100 text-green-700",
		bg: "border-green-200",
		label: "Resolved",
		icon: AlertCircle,
	},
};

export const ClusterCard = ({
	id,
	title,
	pulseType,
	reports,
	confidence,
	radius,
	isCrisis,
	status,
	onClick,
}: ClusterCardProps) => {
	const typeConfig =
		typeIconConfig[pulseType] || typeIconConfig[PulseEnum.Emergency];
	const statusCfg = statusConfig[status];
	const TypeIcon = typeConfig.Icon;

	return (
		<Card
			className={`cursor-pointer transition-all ${statusCfg.bg} border border-danger`}
			onClick={() => onClick?.(id)}
		>
			<div className="p-4 space-y-3">
				<div className="flex items-start gap-1">
					<div className="flex items-center gap-1 flex-1">
						<div className={`p-2 rounded-lg ${typeConfig.color} bg-opacity-10`}>
							<TypeIcon className={`w-5 h-5 ${typeConfig.color}`} />
						</div>
						<div className="flex-1 min-w-0 items-center justify-center">
							<H3 className="font-semibold text-sm truncate">{title}</H3>
						</div>
					</div>
				</div>

				<Separator />

				<div className="grid grid-cols-3 gap-3">
					<div className="flex flex-col items-center p-2 bg-default-50 rounded-lg">
						<div className="flex items-center gap-1 mb-1 text-accent">
							<Users className="w-4 h-4 text-accent" />
							<span className="text-xs text-accent">Reports</span>
						</div>
						<span className="font-bold text-lg text-accent">{reports}</span>
					</div>

					<div className="flex flex-col items-center p-2 bg-default-50 rounded-lg">
						<div className="flex items-center gap-1 mb-1">
							<Gauge className="w-4 h-4 text-accent" />
							<span className="text-xs text-accent">Confidence</span>
						</div>
						<div className="flex items-baseline gap-1">
							<span className="font-bold text-lg text-accent">
								{Math.round(confidence)}
							</span>
							<span className="text-xs text-accent">%</span>
						</div>
					</div>

					<div className="flex flex-col items-center p-2 bg-default-50 rounded-lg">
						<div className="flex items-center gap-1 mb-1">
							<AlertCircle className="w-4 h-4 text-accent" />
							<span className="text-xs text-accent">Radius</span>
						</div>
						<span className="font-bold text-sm text-accent">{radius}</span>
					</div>
				</div>

				{isCrisis && (
					<div className="flex items-center gap-2 p-2 bg-danger-soft-hover border border-danger rounded-lg">
						<AlertTriangle className="w-4 h-4 text-danger shrink-0" />
						<div>
							<P className="text-xs font-semibold text-muted">
								Crisis Mode Active
							</P>
							<P className="text-xs text-muted">
								High concentration of incidents detected
							</P>
						</div>
					</div>
				)}
			</div>
		</Card>
	);
};
