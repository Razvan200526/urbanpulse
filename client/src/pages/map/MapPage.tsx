import { Button } from "@client/components/Button/Button";
import { Dropdown } from "@client/components/Dropdown";
import { Header } from "@client/components/Header";
import { SignalIcon } from "@client/components/icons/SignalIcon";
import type { ModalRefType } from "@client/components/Modal";
import { ClusterMarker } from "@client/components/map/ClusterMarker";
import { MapComponent } from "@client/components/map/MapComponent";
import { PulseHeatmapLayer } from "@client/components/map/PulseHeatmapLayer";
import { PageLoader } from "@client/components/PageLoader";
import { PulseMarker } from "@client/components/PulseMarker";
import { useAuth } from "@client/hooks/useAuth";
import { useGetGeolocation } from "@client/hooks/useGetGeolocation";
import { useUserProfile } from "@client/hooks/useProfileSettings";
import type { ClientClusterType } from "@client/utils/clusterTypes";
import type { ClientPulseType } from "@client/utils/types";
import {
	Card,
	Dropdown as HeroDropdown,
	Separator,
	Toast,
} from "@heroui/react";
import { Filter, Layers, PlusSquare, Zap } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { CreatePulseModal } from "./components/CreatePulseModal";
import { useRetrieveClusters, useRetrieveMapPulses } from "./hooks";

type ViewFilter = "ALL" | "PULSES_ONLY" | "CRISIS_ONLY";

export const MapPage = () => {
	const {
		coords,
		isError: isGeolocationError,
		isLoading: isGeolocationLoading,
	} = useGetGeolocation();
	const { data: user } = useAuth();
	const { data: profile } = useUserProfile();
	const navigate = useNavigate();
	const location = useLocation();
	const modalRef = useRef<ModalRefType>(null);
	const [createModalSession, setCreateModalSession] = useState(0);
	const [emergencyLaunch, setEmergencyLaunch] = useState(false);
	const [safetyCheckinLaunch, setSafetyCheckinLaunch] = useState(false);
	const [isMapUnavailable, setIsMapUnavailable] = useState(false);
	const hasCoords = coords?.lat != null && coords?.long != null;
	const mapPulseRadius = profile?.alertPreferences.heroAlertRadiusMeters ?? 500;
	const retrievePayload = useMemo(
		() => ({
			position: { x: coords?.long ?? 0, y: coords?.lat ?? 0 },
			radius: mapPulseRadius,
		}),
		[coords?.lat, coords?.long, mapPulseRadius],
	);

	const openCreateModal = (
		emergency: boolean,
		options?: { safetyCheckin?: boolean },
	) => {
		setEmergencyLaunch(emergency);
		setSafetyCheckinLaunch(options?.safetyCheckin === true);
		setCreateModalSession((s) => s + 1);
		queueMicrotask(() => modalRef.current?.open());
	};

	const { data: pulseList = [] } = useRetrieveMapPulses(
		retrievePayload,
		hasCoords && Boolean(user?.user.id),
	);

	const { data: clusterList = [] } = useRetrieveClusters(
		{
			lat: coords?.lat ?? 0,
			lng: coords?.long ?? 0,
			radius: mapPulseRadius,
		},
		hasCoords && Boolean(user?.user.id),
	);

	const [viewFilter, setViewFilter] = useState<ViewFilter>("ALL");

	useEffect(() => {
		const state = location.state as {
			safetyCheckin?: boolean;
			launchMode?: "safety-checkin";
		} | null;
		if (!state?.safetyCheckin && state?.launchMode !== "safety-checkin") {
			return;
		}
		setEmergencyLaunch(true);
		setSafetyCheckinLaunch(true);
		setCreateModalSession((s) => s + 1);
		queueMicrotask(() => modalRef.current?.open());
		navigate(location.pathname, { replace: true, state: null });
	}, [location.state, location.pathname, navigate]);

	useEffect(() => {
		if (!isGeolocationLoading && !hasCoords && isGeolocationError) {
			Toast.toast.danger(
				`Failed to fetch location.Make sure you allow the browser to access your location. ${isGeolocationError} , ${isGeolocationLoading} ${hasCoords} `,
			);
			navigate("/dashboard", { replace: true });
		}
	}, [hasCoords, isGeolocationError, isGeolocationLoading, navigate]);

	if (isGeolocationLoading) {
		return (
			<div className="w-full h-full">
				<PageLoader />
			</div>
		);
	}

	return (
		<div className="flex h-[calc(100dvh)] w-full min-w-0 flex-col overflow-hidden bg-surface">
			<Header title="Your Neighbourhood" />
			<Separator />
			<div className="relative min-h-0 flex-1">
				{hasCoords && (
					<MapComponent
						center={[coords?.long ?? 0, coords?.lat ?? 0]}
						zoom={15}
						onUnavailableChange={setIsMapUnavailable}
						fallback={
							<div className="flex h-full items-center justify-center p-4">
								<Card className="w-full max-w-xl border border-accent bg-surface/90 shadow-none">
									<Card.Content className="space-y-4 p-5">
										<div>
											<p className="text-sm font-semibold text-accent">
												Map view is temporarily unavailable
											</p>
											<p className="mt-1 text-sm text-muted">
												Live neighborhood pulses are still loading, and you can
												still create or respond while the map provider recovers.
											</p>
										</div>
										<div className="space-y-2">
											{pulseList.length > 0 ? (
												pulseList.slice(0, 5).map((pulse: ClientPulseType) => (
													<div
														key={pulse.id}
														className="rounded border border-border bg-surface-secondary/70 px-3 py-2"
													>
														<p className="text-sm font-medium text-foreground">
															{pulse.title}
														</p>
														<p className="text-xs text-muted">
															{pulse.type} · {pulse.urgency}
															{pulse.incidentType
																? ` · ${pulse.incidentType.label}`
																: ""}
														</p>
													</div>
												))
											) : (
												<p className="text-sm text-muted">
													No nearby pulses are active right now.
												</p>
											)}
										</div>
									</Card.Content>
								</Card>
							</div>
						}
					>
						{(viewFilter === "ALL" || viewFilter === "PULSES_ONLY") && (
							<>
								<PulseHeatmapLayer pulses={pulseList} />
								{pulseList.map((pulse: ClientPulseType) => (
									<PulseMarker key={pulse.id} pulse={pulse} />
								))}
							</>
						)}
						{(viewFilter === "ALL" || viewFilter === "CRISIS_ONLY") &&
							clusterList.map((cluster: ClientClusterType) => (
								<ClusterMarker key={cluster.id} cluster={cluster} />
							))}
					</MapComponent>
				)}
				<div className="absolute inset-x-4 bottom-4 z-50 flex flex-col gap-2 sm:inset-x-auto sm:bottom-auto sm:right-4 sm:top-4">
					<Dropdown
						placement="bottom end"
						className="text-accent"
						trigger={
							<HeroDropdown.Trigger className="flex h-9 items-center justify-center gap-2 rounded border border-accent bg-surface px-4 text-sm font-medium text-accent shadow-sm hover:bg-surface-secondary sm:w-auto">
								<Filter className="size-4" />
								<span>
									{viewFilter === "ALL"
										? "All View"
										: viewFilter === "PULSES_ONLY"
											? "Only Pulses"
											: "Only Crisis"}
								</span>
							</HeroDropdown.Trigger>
						}
						onAction={(key) => setViewFilter(key as ViewFilter)}
						items={[
							{
								key: "ALL",
								label: "All (Pulses + Crisis)",
								labelClassName: "text-accent",
								icon: <Layers className="size-4" />,
							},
							{
								key: "PULSES_ONLY",
								label: "Only Pulses",
								labelClassName: "text-accent",
								icon: <PlusSquare className="size-4" />,
							},
							{
								key: "CRISIS_ONLY",
								label: "Only Crisis",
								labelClassName: "text-accent",
								icon: <Zap className="size-4" />,
							},
						]}
					/>
					<Button
						variant="primary"
						className="w-full border border-accent sm:w-auto"
						startContent={<PlusSquare className="size-4" />}
						onPress={() => openCreateModal(false)}
					>
						Create pulse
					</Button>
					{coords && (
						<CreatePulseModal
							coords={coords}
							key={createModalSession}
							modalRef={modalRef}
							emergencyLaunch={emergencyLaunch}
							safetyCheckinLaunch={safetyCheckinLaunch}
						/>
					)}
					<Button
						variant="danger"
						className="w-full sm:w-auto"
						startContent={<SignalIcon className="size-4" />}
						onPress={() => openCreateModal(true)}
					>
						{isMapUnavailable ? "Emergency post" : "Emergency"}
					</Button>
				</div>
			</div>
		</div>
	);
};
