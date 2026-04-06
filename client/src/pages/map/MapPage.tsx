import { Button } from "@client/components/Button/Button";
import { Header } from "@client/components/Header";
import { SignalIcon } from "@client/components/icons/SignalIcon";
import type { ModalRefType } from "@client/components/Modal";
import { MapComponent } from "@client/components/map/MapComponent";
import { PulseHeatmapLayer } from "@client/components/map/PulseHeatmapLayer";
import { PageLoader } from "@client/components/PageLoader";
import { PulseMarker } from "@client/components/PulseMarker";
import { useAuth } from "@client/hooks/useAuth";
import { useGetGeolocation } from "@client/hooks/useGetGeolocation";
import { useUserProfile } from "@client/hooks/useProfileSettings";
import type { ClientPulseType } from "@client/utils/types";
import { Separator, Toast } from "@heroui/react";
import { PlusSquare } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { CreatePulseModal } from "./components/CreatePulseModal";
import { useRetrieveMapPulses } from "./hooks";

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
	const hasCoords = coords?.lat != null && coords?.long != null;
	const mapPulseRadius = profile?.alertPreferences.heroAlertRadiusMeters ?? 500;
	const retrievePayload = useMemo(
		() => ({
			position: { x: coords?.long ?? 0, y: coords?.lat ?? 0 },
			radius: mapPulseRadius,
		}),
		[coords?.lat, coords?.long, mapPulseRadius],
	);

	const openCreateModal = (emergency: boolean) => {
		setEmergencyLaunch(emergency);
		setCreateModalSession((s) => s + 1);
		queueMicrotask(() => modalRef.current?.open());
	};

	const { data: pulseList = [] } = useRetrieveMapPulses(
		retrievePayload,
		hasCoords && Boolean(user?.user.id),
	);

	useEffect(() => {
		const state = location.state as { safetyCheckin?: boolean } | null;
		if (!state?.safetyCheckin) return;
		setEmergencyLaunch(true);
		setCreateModalSession((s) => s + 1);
		queueMicrotask(() => modalRef.current?.open());
		navigate(location.pathname, { replace: true, state: null });
	}, [location.state, location.pathname, navigate]);

	useEffect(() => {
		if (!isGeolocationLoading && !hasCoords && isGeolocationError) {
			Toast.toast.danger(
				"Failed to fetch location.Make sure you allow the browser to access your location.",
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
						zoom={17}
					>
						<PulseHeatmapLayer pulses={pulseList} />
						{pulseList.map((pulse: ClientPulseType) => (
							<PulseMarker key={pulse.id} pulse={pulse} />
						))}
					</MapComponent>
				)}
				<div className="absolute inset-x-4 bottom-4 z-50 flex flex-col gap-3 sm:inset-x-auto sm:bottom-auto sm:right-4 sm:top-4">
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
						/>
					)}
					<Button
						variant="danger"
						className="w-full sm:w-auto"
						startContent={<SignalIcon className="size-4" />}
						onPress={() => openCreateModal(true)}
					>
						Emergency
					</Button>
				</div>
			</div>
		</div>
	);
};
