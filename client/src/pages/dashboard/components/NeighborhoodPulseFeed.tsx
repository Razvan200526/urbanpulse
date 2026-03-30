import { Button } from "@client/components/Button/Button";
import { useAuth } from "@client/hooks/useAuth";
import { useGetGeolocation } from "@client/hooks/useGetGeolocation";
import { queryClient } from "@client/main";
import { useRetrievePulses } from "@client/pages/map/hooks";
import { Card, Separator } from "@heroui/react";
import type { PulseType } from "@server/db/schema";
import { PulseEnum, PulseStatusEnum, UrgencyEnum } from "@shared/types";
import { formatDate } from "@shared/utils/formatDate";
import { AlertTriangle, PackageIcon, TrendingUp, Wrench } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { sortPulsesForFeed } from "../sortPulsesForFeed";

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

export function NeighborhoodPulseFeed() {
	const navigate = useNavigate();
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
		isLoading: geoLoading,
		isError: geoError,
	} = useGetGeolocation();

	const enabled = !!user?.user.id && coords != null && !geoError;
	const retrievePayload = useMemo(
		() => ({
			userId: user?.user.id || "",
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
			user?.user.id,
		],
	);

	const {
		data: pulsesRes,
		isPending,
		refetch,
		isFetching,
	} = useRetrievePulses(
		retrievePayload,
		enabled,
	);

	const sorted = useMemo(() => {
		const raw = pulsesRes?.data ?? [];
		return sortPulsesForFeed(raw);
	}, [pulsesRes?.data]);

	const onRefresh = () => {
		queryClient.invalidateQueries({ queryKey: ["pulse", "retrieve"] });
		refetch();
	};

	return (
		<Card className="shadow-none border border-border">
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
				<Button
					size="sm"
					variant="primary"
					isPending={isFetching}
					onPress={onRefresh}
				>
					Refresh
				</Button>
			</Card.Header>
			<Card.Content className="space-y-3 min-h-[200px]">
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
								variant={radius === option.value ? "primary" : "outline"}
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
								variant={typeFilter === option.value ? "primary" : "outline"}
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
								variant={statusFilter === option.value ? "primary" : "outline"}
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
									urgencyFilter === option.value ? "primary" : "outline"
								}
								onPress={() => setUrgencyFilter(option.value)}
							>
								{option.label}
							</Button>
						))}
					</div>
				</div>
				{geoLoading && (
					<p className="text-sm text-muted">Getting your location…</p>
				)}
				{geoError && (
					<p className="text-sm text-danger">
						Turn on location to load pulses within ~500m of you.
					</p>
				)}
				{enabled && isPending && (
					<p className="text-sm text-muted">Loading neighborhood feed…</p>
				)}
				{enabled && !isPending && sorted.length === 0 && (
					<p className="text-sm text-muted">
						No active pulses nearby. Create one from the map.
					</p>
				)}
				{sorted.map((pulse: PulseType) => (
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
							</p>
						</div>
					</Link>
				))}
			</Card.Content>
			<Separator />
			<Card.Footer>
				<Button
					size="sm"
					variant="primary"
					fullWidth
					onPress={() => navigate("/map")}
				>
					Open map
				</Button>
			</Card.Footer>
		</Card>
	);
}
