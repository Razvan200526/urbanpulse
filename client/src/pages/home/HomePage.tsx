// import { Loader } from "@client/components/Loader";
// import { PulseMarker } from "@client/components/PulseMarker";
// import { useGetGeolocation } from "@client/hooks/useGetGeolocation";
// import { Toast } from "@heroui/react";
// import { MapPreview } from "../landing-page/components/MapPreview";

// export const HomePage = () => {
// 	const { coords, isError, isLoading } = useGetGeolocation();

// 	if (isError) {
// 		Toast.toast.danger("Failed to get geolocation");
// 	}

// 	if (isLoading || !coords) {
// 		return <Loader />;
// 	}
// 	return (
// 		<div className="w-full h-screen relative flex">
// 			{/* <Sidebar /> - Assume we might add something else here, adjusting layout as needed later */}
// 			<div className="flex-1 relative">
// 				<MapPreview center={[coords.long, coords.lat]} zoom={14}>
// 					<PulseMarker
// 						position={{ x: coords.lat, y: coords.long }}
// 						type="emergency"
// 					/>
// 				</MapPreview>
// 			</div>
// 		</div>
// 	);
// };
