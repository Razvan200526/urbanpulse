import { PulseMarker } from "@client/components/PulseMarker";
import { MapComponent } from "../../components/map/MapComponent";
import { useGetGeolocation } from "../../hooks/useGetGeolocation";
import { getFakePulses } from "./fakePulses";

export const MapPreview = () => {
	const { coords } = useGetGeolocation();
	const pulses = coords ? getFakePulses(coords) : [];

	return (
		<MapComponent
			center={coords ? [coords.long, coords.lat] : [26.1025, 44.4268]}
			zoom={14}
			className="rounded"
			style={{ width: "100%", height: "400px", minHeight: "400px" }}
		>
			{pulses.map((pulse) => (
				<PulseMarker key={pulse.id} pulse={pulse} />
			))}
		</MapComponent>
	);
};
