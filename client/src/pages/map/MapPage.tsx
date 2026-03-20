import { useGetGeolocation } from "@client/hooks/useGetGeolocation";
import { Toast } from "@heroui/react";
import { Loader } from "@client/components/Loader";
// biome-ignore lint/suspicious/noShadowRestrictedNames: Component is named Map
import { Map } from "@client/components/map/Map";
import { PulseMarker } from "@client/components/PulseMarker";

export const MapPage = () => {
	const { coords, isError, isLoading } = useGetGeolocation();

	if (isError) {
		Toast.toast.danger("Failed to get geolocation");
	}

	if (isLoading || !coords) {
		return <Loader />;
	}
	return (
		<div className="w-full h-screen relative flex">
			{/* <Sidebar /> - Assume we might add something else here, adjusting layout as needed later */}
			<div className="flex-1 relative">
				<Map center={[coords.long, coords.lat]} zoom={14}>
					<PulseMarker coords={coords} type="emergency" />
				</Map>
			</div>
		</div>
	);
};
