import { Button } from "@client/components/Button/Button";
import { Loader } from "@client/components/Loader";
// biome-ignore lint/suspicious/noShadowRestrictedNames: Component is named Map
import { Map } from "@client/components/map/Map";
import { PulseMarker } from "@client/components/PulseMarker";
import { useGetGeolocation } from "@client/hooks/useGetGeolocation";
import { Toast } from "@heroui/react";
import { Socket } from "client/sdk/Socket";
import { PlusSquare } from "lucide-react";
export const MapPage = () => {
	const { coords, isError, isLoading } = useGetGeolocation();

	const _ws = new Socket(`${import.meta.env.VITE_SERVER_URL}/api/pulse/ws`);
	console.log(import.meta.env.VITE_SERVER_URL);
	if (isError) {
		Toast.toast.danger("Failed to get geolocation");
	}

	if (isLoading || !coords) {
		return <Loader />;
	}
	return (
		<div className="w-full h-screen">
			<Map center={[coords.long, coords.lat]} zoom={14}>
				<Button
					className="absolute top-4 right-4"
					variant="secondary"
					startContent={<PlusSquare className="size-4" />}
				>
					Create pulse
				</Button>
				<PulseMarker coords={coords} type="emergency" />
			</Map>
		</div>
	);
};
