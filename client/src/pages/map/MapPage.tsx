import { Button } from "@client/components/Button/Button";
import { SignalIcon } from "@client/components/icons/SignalIcon";
import type { ModalRefType } from "@client/components/Modal";
import { MapComponent } from "@client/components/map/MapComponent";
import { PulseHeatmapLayer } from "@client/components/map/PulseHeatmapLayer";
import { PageLoader } from "@client/components/PageLoader";
import { PulseMarker } from "@client/components/PulseMarker";
import { useAuth } from "@client/hooks/useAuth";
import { useGetGeolocation } from "@client/hooks/useGetGeolocation";
import { Toast } from "@heroui/react";
import type { PulseType } from "@server/db/schema";
import { PlusSquare } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { CreatePulseModal } from "./components/CreatePulseModal";
import { useRetrievePulses } from "./hooks";

export const MapPage = () => {
	const {
		coords,
		isError: isGeolocationError,
		isLoading: isGeolocationLoading,
	} = useGetGeolocation();
	const { data: user } = useAuth();
	const navigate = useNavigate();
	const location = useLocation();
	const modalRef = useRef<ModalRefType>(null);
	const [createModalSession, setCreateModalSession] = useState(0);
	const [emergencyLaunch, setEmergencyLaunch] = useState(false);
	const hasCoords = coords?.lat != null && coords?.long != null;

	const openCreateModal = (emergency: boolean) => {
		setEmergencyLaunch(emergency);
		setCreateModalSession((s) => s + 1);
		queueMicrotask(() => modalRef.current?.open());
	};

	const { data: pulses } = useRetrievePulses(
		{
			userId: user?.user.id || "",
			position: { x: coords?.long ?? 0, y: coords?.lat ?? 0 },
		},
		hasCoords && !!user,
	);

	const pulseList = pulses?.data ?? [];

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

	if (!hasCoords && isGeolocationLoading) {
		return (
			<div className="w-full h-full">
				<PageLoader />
			</div>
		);
	}

	return (
		<div className="relative w-full h-full">
			{hasCoords && (
				<MapComponent center={[coords?.long ?? 0, coords?.lat ?? 0]} zoom={17}>
					<PulseHeatmapLayer pulses={pulseList} />
					{pulseList.map((pulse: PulseType) => (
						<PulseMarker key={pulse.id} pulse={pulse} />
					))}
				</MapComponent>
			)}
			<div className="absolute top-4 right-4 z-50 flex items-center justify-end gap-4">
				<Button
					variant="primary"
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
					startContent={<SignalIcon className="size-4" />}
					onPress={() => openCreateModal(true)}
				>
					Emergency
				</Button>
			</div>
		</div>
	);
};
