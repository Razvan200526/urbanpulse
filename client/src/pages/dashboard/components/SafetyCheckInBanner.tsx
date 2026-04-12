import { Button } from "@client/components/Button/Button";
import { useWeatherAlerts } from "@client/hooks/useWeatherAlerts";
import { useRetrievePulses } from "@client/pages/map/hooks";
import { Card } from "@heroui/react";
import { PulseEnum, PulseStatusEnum } from "@shared/types";
import { AlertTriangle, ShieldCheck } from "lucide-react";
import { useMemo } from "react";
import { useNavigate } from "react-router";
import { sortPulsesForFeed } from "../sortPulsesForFeed";
import { PulseList } from "./PulseList";

type Props = {
	lat: number | undefined;
	lon: number | undefined;
	geoReady: boolean;
};

export function SafetyCheckInBanner({ lat, lon, geoReady }: Props) {
	const navigate = useNavigate();
	const { data, isPending, isError } = useWeatherAlerts(lat, lon);
	const retrievePayload = useMemo(
		() => ({
			position: { x: lon ?? 0, y: lat ?? 0 },
			radius: 2000,
			status: PulseStatusEnum.Active,
			type: PulseEnum.Emergency,
		}),
		[lat, lon],
	);
	const { data: nearbyPulses, isPending: isThreadPending } = useRetrievePulses(
		retrievePayload,
		geoReady &&
			Boolean(data?.configured) &&
			Boolean(data?.severe) &&
			lat != null &&
			lon != null,
	);

	if (!geoReady || isPending || isError || !data?.configured || !data.severe) {
		return null;
	}

	const safetyThread = sortPulsesForFeed(
		(nearbyPulses?.data ?? [])
			.filter((pulse) => {
				const haystack = [pulse.title, pulse.description ?? ""]
					.join(" ")
					.toLowerCase();
				return (
					pulse.requestedSkillTags.includes("community-support") ||
					haystack.includes("check-in") ||
					haystack.includes("check in") ||
					haystack.includes("i'm safe") ||
					haystack.includes("im safe") ||
					haystack.includes("safe right now")
				);
			})
			.map((pulse) => ({
				...pulse,
				createdAt: new Date(pulse.createdAt),
			})),
	).slice(0, 3);

	return (
		<Card className="border-2 border-danger/40 bg-danger/5 shadow-none">
			<Card.Content className="p-4">
				<div className="flex flex-col gap-4">
					<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
						<div className="flex gap-3 min-w-0">
							<div className="shrink-0 p-2 rounded-full bg-danger-soft border border-danger/30">
								<AlertTriangle className="size-6 text-danger" />
							</div>
							<div className="min-w-0">
								<h3 className="font-semibold text-danger flex items-center gap-2 text-sm sm:text-base">
									Safety check-in
									<span className="text-xs font-normal text-muted">
										Severe weather near you
									</span>
								</h3>
								<p className="text-xs text-muted mt-1 leading-relaxed">
									{data.alerts.find((a) => a.severe)?.event ??
										"Authorities have issued a significant weather alert."}{" "}
									Let neighbors know you are okay or if you need help.
								</p>
							</div>
						</div>
						<div className="flex flex-col sm:flex-row gap-2 shrink-0">
							<Button
								variant="danger"
								size="sm"
								startContent={<ShieldCheck className="size-4" />}
								onPress={() =>
									navigate("/map", {
										state: {
											safetyCheckin: true,
											launchMode: "safety-checkin",
										},
									})
								}
							>
								Post check-in pulse
							</Button>
							<Button
								variant="primary"
								size="sm"
								onPress={() => navigate("/map")}
							>
								View map
							</Button>
						</div>
					</div>
					<div className="rounded border border-danger/20 bg-surface/80 p-3">
						<div className="flex items-center justify-between gap-3">
							<div>
								<p className="text-xs font-semibold uppercase tracking-wide text-danger">
									Pinned safety thread
								</p>
								<p className="text-xs text-muted">
									Recent nearby check-ins stay pinned here until the alert clears.
								</p>
							</div>
						</div>
						<div className="mt-3 space-y-2">
							{isThreadPending ? (
								<p className="text-xs text-muted">
									Loading nearby safety check-ins...
								</p>
							) : safetyThread.length > 0 ? (
								<PulseList pulses={safetyThread} />
							) : (
								<p className="text-xs text-muted">
									No neighbors have posted a safety check-in nearby yet.
								</p>
							)}
						</div>
					</div>
				</div>
			</Card.Content>
		</Card>
	);
}
