import { Button } from "@client/components/Button/Button";
import { useAuth } from "@client/hooks/useAuth";
import { useGetGeolocation } from "@client/hooks/useGetGeolocation";
import { useRetrievePulses } from "@client/pages/map/hooks";
import { useCrisisStore } from "@client/stores/crisisStore";
import { Card, ScrollShadow } from "@heroui/react";
import { PulseEnum, PulseStatusEnum, UrgencyEnum } from "@shared/types";
import { AlertTriangle, TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { sortPulsesForFeed } from "../sortPulsesForFeed";
import { PulseList } from "./PulseList";

export function NeighborhoodPulseFeed() {
	const navigate = useNavigate();
	const isCrisisModeActive = useCrisisStore((s) => s.isCrisisModeActive);
	const { data: user } = useAuth();
	const [radius, setRadius] = useState(500);
	const [typeFilter, setTypeFilter] = useState<PulseEnum | "ALL">("ALL");
	const [urgencyFilter, setUrgencyFilter] = useState<UrgencyEnum | "ALL">(
		"ALL",
	);
	const [statusFilter, setStatusFilter] = useState<PulseStatusEnum | "ALL">(
		PulseStatusEnum.Active,
	);
	const {
		coords,
		isError: geoError,
		refresh: refreshGeo,
	} = useGetGeolocation();

	const enabled = !!user?.user.id && coords != null && !geoError;
	const retrievePayload = useMemo(
		() => ({
			position: { x: coords?.long ?? 0, y: coords?.lat ?? 0 },
			radius,
			...(typeFilter !== "ALL" ? { type: typeFilter } : {}),
			...(urgencyFilter !== "ALL" ? { urgency: urgencyFilter } : {}),
			...(statusFilter !== "ALL" ? { status: statusFilter } : {}),
		}),
		[
			coords?.lat,
			coords?.long,
			radius,
			statusFilter,
			typeFilter,
			urgencyFilter,
		],
	);

	const { data: pulsesRes, isPending } = useRetrievePulses(
		retrievePayload,
		enabled,
	);

	const sorted = useMemo(() => {
		const raw = (pulsesRes?.data ?? []).map((pulse) => {
			return { ...pulse, createdAt: new Date(pulse.createdAt) };
		});
		return sortPulsesForFeed(raw);
	}, [pulsesRes?.data]);

	return (
		<Card className="border border-accent shadow-none">
			<Card.Header className="flex flex-row items-center justify-between gap-2">
				<div className="min-w-0">
					<Card.Title className="text-lg flex items-center text-accent gap-2">
						<TrendingUp className="size-4 shrink-0" />
						Neighborhood pulses
					</Card.Title>
					<button
						type="button"
						className="text-[11px] text-accent/80 hover:underline mt-1 text-left"
						onClick={() => navigate("/alerts")}
					>
						Notification history
					</button>
				</div>
			</Card.Header>
			<Card.Content className="space-y-3 min-h-50">
				{isCrisisModeActive && (
					<div className="flex items-center gap-3 p-3 bg-red-100 border border-red-200 rounded-lg animate-pulse mb-2">
						<AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
						<div>
							<p className="text-xs font-bold text-red-700 uppercase">
								CRISIS ACTIVE NEAR YOU
							</p>
							<p className="text-[10px] text-red-600 leading-tight">
								Multiple emergency incidents detected. Please stay alert and
								coordinate with neighbors.
							</p>
						</div>
					</div>
				)}
				<div className="space-y-2">
					<div className="flex flex-wrap gap-2">
						{[
							{ label: "500m", value: 500 },
							{ label: "1km", value: 1000 },
							{ label: "2km", value: 2000 },
						].map((option) => (
							<Button
								key={option.value}
								size="sm"
								variant={radius === option.value ? "primary" : "secondary"}
								onPress={() => setRadius(option.value)}
							>
								{option.label}
							</Button>
						))}
					</div>
					<div className="flex flex-wrap gap-2">
						{[
							{ label: "All types", value: "ALL" as const },
							{ label: "Emergency", value: PulseEnum.Emergency },
							{ label: "Skill", value: PulseEnum.Skill },
							{ label: "Item", value: PulseEnum.Item },
						].map((option) => (
							<Button
								key={option.label}
								size="sm"
								variant={typeFilter === option.value ? "primary" : "secondary"}
								onPress={() => setTypeFilter(option.value)}
							>
								{option.label}
							</Button>
						))}
					</div>
					<div className="flex flex-wrap gap-2">
						{[
							{ label: "Active", value: PulseStatusEnum.Active },
							{ label: "Resolved", value: PulseStatusEnum.Resolved },
							{ label: "Dismissed", value: PulseStatusEnum.Dismissed },
							{ label: "All statuses", value: "ALL" as const },
						].map((option) => (
							<Button
								key={option.label}
								size="sm"
								variant={
									statusFilter === option.value ? "primary" : "secondary"
								}
								onPress={() => setStatusFilter(option.value)}
							>
								{option.label}
							</Button>
						))}
					</div>
					<div className="flex flex-wrap gap-2">
						{[
							{ label: "All urgency", value: "ALL" as const },
							{ label: "Immediate", value: UrgencyEnum.Immediate },
							{ label: "Urgent", value: UrgencyEnum.Urgent },
							{ label: "Not urgent", value: UrgencyEnum.NotUrgent },
						].map((option) => (
							<Button
								key={option.label}
								size="sm"
								variant={
									urgencyFilter === option.value ? "primary" : "secondary"
								}
								onPress={() => setUrgencyFilter(option.value)}
							>
								{option.label}
							</Button>
						))}
					</div>
				</div>
				{geoError && (
					<div className="space-y-1">
						<div className="flex items-center justify-between gap-2">
							<p className="text-sm text-danger">{geoError}</p>
							<Button size="sm" variant="secondary" onPress={refreshGeo}>
								Retry
							</Button>
						</div>
						<p className="text-[10px] text-muted italic">
							Check browser permissions or ensure you're using a secure (HTTPS)
							connection.
						</p>
					</div>
				)}
				{enabled && !isPending && sorted.length === 0 && (
					<p className="text-sm text-muted">
						No active pulses nearby. Create one from the map.
					</p>
				)}

				<ScrollShadow className="max-h-80 overflow-y-scroll space-y-2">
					<PulseList pulses={sorted} />
				</ScrollShadow>
			</Card.Content>
		</Card>
	);
}
