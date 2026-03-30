import { MapComponent } from "../../components/map/MapComponent";
import { useGetGeolocation } from "../../hooks/useGetGeolocation";

export const MapPreview = () => {
	const { coords } = useGetGeolocation();

	return (
		<MapComponent
			center={coords ? [coords.long, coords.lat] : [26.1025, 44.4268]}
			zoom={14}
			className="rounded"
			style={{ width: "100%", height: "400px", minHeight: "400px" }}
		/>
	);
};
