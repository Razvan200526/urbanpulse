import { Button } from "@client/components/Button/Button";
import { useAuth } from "@client/hooks/useAuth";
import { useGetGeolocation } from "@client/hooks/useGetGeolocation";
import { useRetrievePulses } from "@client/pages/map/hooks";
import { useCrisisStore } from "@client/stores/crisisStore";
import { Card, ScrollShadow } from "@heroui/react";
import { PulseEnum, PulseStatusEnum, UrgencyEnum } from "@shared/types";
import { AlertTriangle, TrendingUp } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
	sortCrisisEmergencyPulses,
	sortPulsesForFeed,
} from "../sortPulsesForFeed";
import { PulseList } from "./PulseList";

const radiusOptions = [
	{ label: "500m", value: 500 },
	{ label: "1km", value: 1000 },
	{ label: "2km", value: 2000 },
] as const;

const typeOptions = [
	{ label: "All types", value: "ALL" as const },
	{ label: "Emergency", value: PulseEnum.Emergency },
	{ label: "Skill", value: PulseEnum.Skill },
	{ label: "Item", value: PulseEnum.Item },
] as const;

const statusOptions = [
	{ label: "Active", value: PulseStatusEnum.Active },
	{ label: "Resolved", value: PulseStatusEnum.Resolved },
	{ label: "Dismissed", value: PulseStatusEnum.Dismissed },
	{ label: "All statuses", value: "ALL" as const },
] as const;

const urgencyOptions = [
	{ label: "All urgency", value: "ALL" as const },
	{ label: "Immediate", value: UrgencyEnum.Immediate },
	{ label: "Urgent", value: UrgencyEnum.Urgent },
	{ label: "Not urgent", value: UrgencyEnum.NotUrgent },
] as const;

const crisisFeedOptions = [
	{ label: "Emergency", value: "emergency" as const },
	{ label: "Community", value: "community" as const },
] as const;

type CrisisFeedTab = (typeof crisisFeedOptions)[number]["value"];

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
	const [crisisFeedTab, setCrisisFeedTab] =
		useState<CrisisFeedTab>("emergency");
	const {
		coords,
		isError: geoError,
		refresh: refreshGeo,
	} = useGetGeolocation();

	useEffect(() => {
		if (isCrisisModeActive) {
			setCrisisFeedTab("emergency");
		}
	}, [isCrisisModeActive]);

	const enabled = !!user?.user.id && coords != null && !geoError;
	const retrievePayload = useMemo(
		() => ({
			position: { x: coords?.long ?? 0, y: coords?.lat ?? 0 },
			radius,
			...(isCrisisModeActive
				? { status: PulseStatusEnum.Active }
				: {
						...(typeFilter !== "ALL" ? { type: typeFilter } : {}),
						...(urgencyFilter !== "ALL" ? { urgency: urgencyFilter } : {}),
						...(statusFilter !== "ALL" ? { status: statusFilter } : {}),
					}),
		}),
		[
			coords?.lat,
			coords?.long,
			isCrisisModeActive,
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

	const { sorted, emergencyPulses, communityPulses } = useMemo(() => {
		const raw = (pulsesRes?.data ?? []).map((pulse) => {
			return { ...pulse, createdAt: new Date(pulse.createdAt) };
		});
		const sortedPulses = sortPulsesForFeed(raw);
		const emergency = raw.filter((pulse) => pulse.type === PulseEnum.Emergency);
		const community = raw.filter((pulse) => pulse.type !== PulseEnum.Emergency);

		return {
			sorted: sortedPulses,
			emergencyPulses: sortCrisisEmergencyPulses(emergency),
			communityPulses: sortPulsesForFeed(community),
		};
	}, [pulsesRes?.data]);

	const visiblePulses = isCrisisModeActive
		? crisisFeedTab === "emergency"
			? emergencyPulses
			: communityPulses
		: sorted;

	const emptyStateMessage = isCrisisModeActive
		? crisisFeedTab === "emergency"
			? "No active emergency pulses nearby. Community requests remain available in the secondary view."
			: "No nearby community requests right now."
		: "No active pulses nearby. Create one from the map.";

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
					<div className="mb-2 flex items-center gap-3 rounded-lg border border-red-200 bg-red-100 p-3">
						<AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
						<div>
							<p className="text-xs font-bold text-red-700 uppercase">
								CRISIS ACTIVE NEAR YOU
							</p>
							<p className="text-[10px] text-red-600 leading-tight">
								Active emergency reports stay front and center while community
								requests move into a secondary view.
							</p>
						</div>
					</div>
				)}
				<div className="space-y-2">
					<div className="flex flex-wrap gap-2">
						{radiusOptions.map((option) => (
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
					{isCrisisModeActive ? (
						<div className="rounded-lg border border-accent/20 bg-surface/40 p-3">
							<div className="flex flex-wrap items-center justify-between gap-2">
								<p className="text-xs font-semibold text-accent">
									Priority feed
								</p>
								<p className="text-[11px] text-muted">
									{emergencyPulses.length} emergency · {communityPulses.length}{" "}
									community
								</p>
							</div>
							<div className="mt-2 flex flex-wrap gap-2">
								{crisisFeedOptions.map((option) => (
									<Button
										key={option.value}
										size="sm"
										variant={
											crisisFeedTab === option.value ? "primary" : "secondary"
										}
										onPress={() => setCrisisFeedTab(option.value)}
									>
										{option.label}
									</Button>
								))}
							</div>
							<p className="mt-2 text-[11px] text-muted">
								Emergency reports stay prioritized. Skill and item requests
								remain available under Community.
							</p>
						</div>
					) : (
						<>
							<div className="flex flex-wrap gap-2">
								{typeOptions.map((option) => (
									<Button
										key={option.label}
										size="sm"
										variant={
											typeFilter === option.value ? "primary" : "secondary"
										}
										onPress={() => setTypeFilter(option.value)}
									>
										{option.label}
									</Button>
								))}
							</div>
							<div className="flex flex-wrap gap-2">
								{statusOptions.map((option) => (
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
								{urgencyOptions.map((option) => (
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
						</>
					)}
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
				{enabled && !isPending && visiblePulses.length === 0 && (
					<p className="text-sm text-muted">{emptyStateMessage}</p>
				)}

				<ScrollShadow className="max-h-80 overflow-y-scroll space-y-2">
					<PulseList pulses={visiblePulses} />
				</ScrollShadow>
			</Card.Content>
		</Card>
	);
}
