import { Button } from "@client/components/Button/Button";
import { MapComponent } from "@client/components/map/MapComponent";
import {
	type SafetyCheckinView,
	useNearbySafetyCheckins,
	useUpsertSafetyCheckin,
} from "@client/hooks/useSafetyCheckins";
import { useCrisisStore } from "@client/stores/crisisStore";
import { Card } from "@heroui/react";
import { SafetyCheckinStatusEnum } from "@shared/types";
import { useMemo } from "react";
import { SafetyCheckinMarkers } from "./SafetyCheckinMarkers";

type Props = {
	lat: number | undefined;
	lon: number | undefined;
	geoReady: boolean;
};

const statusButtons: Array<{
	status: SafetyCheckinStatusEnum;
	label: string;
	emoji: string;
	colorClass: string;
}> = [
	{
		status: SafetyCheckinStatusEnum.Safe,
		label: "I'm Safe",
		emoji: "🟢",
		colorClass: "border-success/50 bg-success/10 text-success",
	},
	{
		status: SafetyCheckinStatusEnum.NeedHelp,
		label: "Need Help",
		emoji: "🔴",
		colorClass: "border-danger/50 bg-danger/10 text-danger",
	},
	{
		status: SafetyCheckinStatusEnum.Injured,
		label: "Injured",
		emoji: "🟠",
		colorClass: "border-warning/50 bg-warning/10 text-warning",
	},
	{
		status: SafetyCheckinStatusEnum.AvailableToHelp,
		label: "Available to Help",
		emoji: "🔵",
		colorClass: "border-primary/50 bg-primary/10 text-primary",
	},
];

const statusLabelMap: Record<SafetyCheckinStatusEnum, string> = {
	[SafetyCheckinStatusEnum.Safe]: "I'm Safe",
	[SafetyCheckinStatusEnum.NeedHelp]: "Need Help",
	[SafetyCheckinStatusEnum.Injured]: "Injured",
	[SafetyCheckinStatusEnum.AvailableToHelp]: "Available to Help",
};

const groupByStatus = (checkins: SafetyCheckinView[]) => {
	return checkins.reduce(
		(acc, checkin) => {
			acc[checkin.status] = (acc[checkin.status] ?? 0) + 1;
			return acc;
		},
		{
			[SafetyCheckinStatusEnum.Safe]: 0,
			[SafetyCheckinStatusEnum.NeedHelp]: 0,
			[SafetyCheckinStatusEnum.Injured]: 0,
			[SafetyCheckinStatusEnum.AvailableToHelp]: 0,
		} as Record<SafetyCheckinStatusEnum, number>,
	);
};

export const CrisisSafetyPanel = ({ lat, lon, geoReady }: Props) => {
	const isCrisisModeActive = useCrisisStore((s) => s.isCrisisModeActive);
	const upsert = useUpsertSafetyCheckin();
	const shouldEnable =
		isCrisisModeActive && geoReady && lat != null && lon != null;
	const { data, isPending } = useNearbySafetyCheckins(
		{
			lat: lat ?? 0,
			lng: lon ?? 0,
			radius: 5000,
		},
		shouldEnable,
	);

	const myStatus = data?.mine?.status ?? null;
	const grouped = useMemo(
		() => groupByStatus(data?.checkins ?? []),
		[data?.checkins],
	);

	if (!isCrisisModeActive) {
		return null;
	}

	return (
		<Card className="border-2 border-warning/50 bg-warning/5 shadow-none">
			<Card.Content className="space-y-4 p-4">
				<div className="space-y-1">
					<p className="text-sm font-semibold text-warning">Safety Check-in</p>
					<p className="text-xs text-muted">
						Crisis Mode is active. Share your status so nearby neighbors can see
						who needs help and who can respond.
					</p>
				</div>

				<div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
					{statusButtons.map((button) => (
						<Button
							key={button.status}
							variant={myStatus === button.status ? "primary" : "outline"}
							className={
								myStatus === button.status
									? ""
									: `justify-start ${button.colorClass}`
							}
							isDisabled={!shouldEnable || upsert.isPending}
							onPress={() => {
								if (lat == null || lon == null) {
									return;
								}
								upsert.mutate({
									status: button.status,
									lat,
									lng: lon,
								});
							}}
						>
							<span>{button.emoji}</span>
							<span>{button.label}</span>
						</Button>
					))}
				</div>

				{myStatus && (
					<p className="text-xs text-muted">
						Your current status:{" "}
						<span className="font-semibold text-accent">
							{statusLabelMap[myStatus]}
						</span>
					</p>
				)}

				{!shouldEnable && (
					<p className="text-xs text-danger">
						Location is required to publish/check nearby safety statuses.
					</p>
				)}

				<div className="rounded border border-accent/30 p-3">
					<div className="mb-2 flex items-center justify-between gap-2">
						<p className="text-xs font-semibold uppercase tracking-wide text-accent">
							Safety Map (5km)
						</p>
						<p className="text-xs text-muted">
							{isPending
								? "Updating..."
								: `${data?.checkins.length ?? 0} check-ins`}
						</p>
					</div>
					<div className="h-56 overflow-hidden rounded border border-accent/20">
						<MapComponent
							center={[lon ?? 0, lat ?? 0]}
							zoom={13}
							className="h-full w-full"
						>
							<SafetyCheckinMarkers checkins={data?.checkins ?? []} />
						</MapComponent>
					</div>
					<div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted sm:grid-cols-4">
						<span>🟢 Safe: {grouped[SafetyCheckinStatusEnum.Safe]}</span>
						<span>
							🔴 Need Help: {grouped[SafetyCheckinStatusEnum.NeedHelp]}
						</span>
						<span>🟠 Injured: {grouped[SafetyCheckinStatusEnum.Injured]}</span>
						<span>
							🔵 Available: {grouped[SafetyCheckinStatusEnum.AvailableToHelp]}
						</span>
					</div>
				</div>
			</Card.Content>
		</Card>
	);
};
