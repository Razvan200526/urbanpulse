import { Button } from "@client/components/Button/Button";
import { SignalIcon } from "@client/components/icons/SignalIcon";
import type { ModalRefType } from "@client/components/Modal";
import { MapComponent } from "@client/components/map/MapComponent";
import { PageLoader } from "@client/components/PageLoader";
import { PulseMarker } from "@client/components/PulseMarker";
import { useAuth } from "@client/hooks/useAuth";
import { useGetGeolocation } from "@client/hooks/useGetGeolocation";
import { Toast } from "@heroui/react";
import type { PulseType } from "@server/db/schema";
import { PlusSquare } from "lucide-react";
import { useMemo, useRef } from "react";
import { useNavigate } from "react-router";
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
	const modalRef = useRef<ModalRefType>(null);

	const mapCenter = useMemo<[number, number]>(
		() => [coords?.long || 0, coords?.lat || 0],
		[coords?.long, coords?.lat],
	);

	const { data: pulses } = useRetrievePulses(
		{
			userId: user?.user.id || "",
			position: { x: coords?.long ?? 0, y: coords?.lat ?? 0 },
		},
		!!coords?.lat && !!coords?.long && !!user,
	);

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
					<PulseMarker key={pulse.id} pulse={pulse} />
				))}
			</MapComponent>
			<div className="absolute top-4 right-4 z-50 flex items-center justify-end gap-4">
				<Button
					variant="primary"
					startContent={<PlusSquare className="size-4" />}
					onPress={() => modalRef.current?.open()}
				>
					Create pulse
				</Button>
				<CreatePulseModal modalRef={modalRef} />
				<Button
					variant="danger"
					startContent={<SignalIcon className="size-4" />}
					onPress={() => {}} //implement this
				>
					Emergency
				</Button>
			</div>
		</div>
	);
};
