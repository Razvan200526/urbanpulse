import { Card, Divider, Chip } from "@heroui/react";
import {
	AlertCircle,
	Zap,
	Package,
	PawPrint,
	AlertTriangle,
	Users,
	Signal,
	Gauge,
} from "lucide-react";
import { PulseEnum } from "@shared/types";

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
		label: "⚠️ CRISIS MODE",
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
	const typeConfig = typeIconConfig[pulseType] || typeIconConfig[PulseEnum.Emergency];
	const statusCfg = statusConfig[status];
	const TypeIcon = typeConfig.Icon;
	const StatusIcon = statusCfg.icon;

	return (
		<Card
			className={`cursor-pointer transition-all hover:shadow-lg ${statusCfg.bg} border`}
			onClick={() => onClick?.(id)}
		>
			<div className="p-4 space-y-3">
				{/* Header with type icon and status badge */}
				<div className="flex items-start justify-between gap-3">
					<div className="flex items-center gap-2 flex-1">
						<div
							className={`p-2 rounded-lg ${typeConfig.color} bg-opacity-10`}
						>
							<TypeIcon className={`w-5 h-5 ${typeConfig.color}`} />
						</div>
						<div className="flex-1 min-w-0">
							<h3 className="font-semibold text-sm truncate">{title}</h3>
							<p className="text-xs text-default-500">
								{typeConfig.label}
							</p>
						</div>
					</div>

					<Chip
						isDisabled
						className={`flex-shrink-0 ${statusCfg.color}`}
						size="sm"
						startContent={
							<StatusIcon className="w-3 h-3 ml-1" />
						}
					>
						{statusCfg.label}
					</Chip>
				</div>

				<Divider />

				{/* Metrics grid */}
				<div className="grid grid-cols-3 gap-3">
					{/* Report Count */}
					<div className="flex flex-col items-center p-2 bg-default-50 rounded-lg">
						<div className="flex items-center gap-1 mb-1">
							<Users className="w-4 h-4 text-default-500" />
							<span className="text-xs text-default-500">Reports</span>
						</div>
						<span className="font-bold text-lg">{reports}</span>
					</div>

					{/* Confidence Score */}
					<div className="flex flex-col items-center p-2 bg-default-50 rounded-lg">
						<div className="flex items-center gap-1 mb-1">
							<Gauge className="w-4 h-4 text-default-500" />
							<span className="text-xs text-default-500">Confidence</span>
						</div>
						<div className="flex items-baseline gap-1">
							<span className="font-bold text-lg">{Math.round(confidence)}</span>
							<span className="text-xs text-default-500">%</span>
						</div>
					</div>

					{/* Radius */}
					<div className="flex flex-col items-center p-2 bg-default-50 rounded-lg">
						<div className="flex items-center gap-1 mb-1">
							<AlertCircle className="w-4 h-4 text-default-500" />
							<span className="text-xs text-default-500">Radius</span>
						</div>
						<span className="font-bold text-lg text-sm">{radius}</span>
					</div>
				</div>

				{/* Crisis Mode Indicator */}
				{isCrisis && (
					<div className="flex items-center gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
						<AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0" />
						<div>
							<p className="text-xs font-semibold text-yellow-700">
								Crisis Mode Active
							</p>
							<p className="text-xs text-yellow-600">
								High concentration of incidents detected
							</p>
						</div>
					</div>
				)}

				{/* Footer description */}
				<p className="text-xs text-default-500">
					Click to view cluster details and respond to incidents
				</p>
			</div>
		</Card>
	);
};
