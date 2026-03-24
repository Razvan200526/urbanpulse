import { Button } from "@client/components/Button/Button";
import { RefreshIcon } from "@client/components/icons/RefreshIcon";
import { MapComponent } from "@client/components/map/MapComponent";
import { PageLoader } from "@client/components/PageLoader";
import { PulseMarker } from "@client/components/PulseMarker";
import { useAuth } from "@client/hooks/useAuth";
import { useGetGeolocation } from "@client/hooks/useGetGeolocation";
import { Toast } from "@heroui/react";
import type { PulseType } from "@server/db/schema";
import { useRetrievePulses } from "./hooks";
import { CreatePulseModal } from "./components/CreatePulseModal";
import { useMemo, useRef } from "react";
import { useNavigate } from "react-router";
import { type ModalRefType } from "@client/components/Modal";
import { PlusSquareIcon } from "lucide-react";

export const MapPage = () => {
	const {
		coords,
		isError: isGeolocationError,
		isLoading: isGeolocationLoading,
	} = useGetGeolocation();
	const { data: user } = useAuth();
	const navigate = useNavigate();
	const mapCenter = useMemo<[number, number]>(
		() => [coords?.long || 0, coords?.lat || 0],
		[coords?.long, coords?.lat],
	);

	const { data: pulses, refetch } = useRetrievePulses({
		userId: user?.user.id || "",
		position: { x: coords?.lat || 0, y: coords?.long || 0 },
	});

	if (isGeolocationLoading) {
		return (
			<div className="w-full h-full">
				<PageLoader />
			</div>
		);
	}
	if (isGeolocationError) {
		Toast.toast.danger(
			"Failed to fetch location.Make sure you allow the browser to access your location.",
		);
		navigate("/dashboard", { replace: true });
	}
	return (
		<div className="relative w-full h-full">
			<MapComponent center={mapCenter} zoom={17}>
				{pulses?.data?.map((pulse: PulseType) => (
					<PulseMarker
						key={pulse.id}
						position={pulse.position}
						type="emergency"
					/>
				))}
			</MapComponent>
			<div className="absolute top-4 right-4 z-50 flex items-center justify-end gap-4">
				<CreatePulseModal />
				<Button
					variant="primary"
					startContent={<RefreshIcon className="size-4" />}
					onPress={() => refetch()}
				>
					Refresh
				</Button>
			</div>
		</div>
	);
};
