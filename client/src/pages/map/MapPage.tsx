import { Button } from "@client/components/Button/Button";
import { RefreshIcon } from "@client/components/icons/RefreshIcon";
import { MapComponent } from "@client/components/map/MapComponent";
import { PageLoader } from "@client/components/PageLoader";
import { PulseMarker } from "@client/components/PulseMarker";
import { useAuth } from "@client/hooks/useAuth";
import { useGetGeolocation } from "@client/hooks/useGetGeolocation";
import { Toast } from "@heroui/react";
import type { PulseType } from "@server/db/schema";
import { PulseEnum, UrgencyEnum } from "@shared/types";
import { PlusSquare } from "lucide-react";
import { useNavigate } from "react-router";
import { useCreatePulse, useRetrievePulses } from "./hooks";

export const MapPage = () => {
	const {
		coords,
		isError: isGeolocationError,
		isLoading: isGeolocationLoading,
	} = useGetGeolocation();
	const { data: user } = useAuth();
	const navigate = useNavigate();
	const { mutateAsync: createPulse } = useCreatePulse();

	const { data: pulses, refetch } = useRetrievePulses({
		userId: user?.user.id || "",
		position: { x: coords?.lat || 0, y: coords?.long || 0 },
	});
	const pulseData = {
		type: PulseEnum.Emergency,
		title: "new pulse",
		userId: user?.user.id || "",
		urgency: UrgencyEnum.Immediate,
		position: { x: coords?.lat || 0, y: coords?.long || 0 },
		isResolved: false,
	};

	if (isGeolocationLoading) {
		return (
			<div className="w-full h-full">
				<PageLoader />
			</div>
		);
	}
	console.log(pulses?.data);
	if (isGeolocationError) {
		Toast.toast.danger(
			"Failed to fetch location.Make sure you allow the browser to access your location.",
		);
		navigate("/dashboard", { replace: true });
	}
	return (
		<div className="relative w-full h-screen">
			<MapComponent center={[coords?.long || 0, coords?.lat || 0]} zoom={14}>
				{pulses?.data?.map((pulse: PulseType) => (
					<PulseMarker
						key={pulse.id}
						position={pulse.position}
						type="emergency"
					/>
				))}
			</MapComponent>
			<div className="absolute top-4 right-4 z-10 flex items-center justify-end gap-4">
				<Button
					variant="secondary"
					startContent={<PlusSquare className="size-4" />}
					onPress={() => createPulse(pulseData)}
				>
					Create pulse
				</Button>
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
