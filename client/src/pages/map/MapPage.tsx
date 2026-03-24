import { Button } from "@client/components/Button/Button";
import { Loader } from "@client/components/Loader";
// biome-ignore lint/suspicious/noShadowRestrictedNames: Component is named Map
import { Map } from "@client/components/map/Map";
import { PulseMarker } from "@client/components/PulseMarker";
import { useGetGeolocation } from "@client/hooks/useGetGeolocation";
import { useAuth } from "@client/hooks/useAuth";
import { PulseEnum, UrgencyEnum } from "@shared/types";
import { Socket } from "client/sdk/Socket";
import { Toast } from "@heroui/react";
import { PlusSquare } from "lucide-react";
import { useRef } from "react";
// import { useGetPulses } from "./hooks";

export const MapPage = () => {
	const {
		coords,
		isError: isGeolocationError,
		isLoading,
	} = useGetGeolocation();
	const { data: user } = useAuth();

	// const { pulses } = useGetPulses(user?.user.id, {
	// 	lat: coords?.lat || 0,
	// 	lng: coords?.long || 0,
	// });

	const wsRef = useRef<Socket | null>(null);

	if (!wsRef.current) {
		wsRef.current = new Socket(
			`${import.meta.env.VITE_SERVER_URL}/api/pulse/ws`,
		);

		wsRef.current.on("message", (response: any) => {
			if (response.success && response.message === "Pulse created") {
				Toast.toast.success("Pulse created successfully");
			}
		});
	}

	const handleClick = () => {
		if (!coords || !user?.user.id) return;

		wsRef.current?.send({
			id: crypto.randomUUID(),
			key: "create:pulse",
			channelName: "create:pulse",
			data: {
				type: PulseEnum.Emergency,
				title: "new pulse",
				userId: user.user.id,
				urgency: UrgencyEnum.Immediate,
				position: { lat: coords.lat, lng: coords.long },
				isResolved: false,
			},
		});
	};

	if (isGeolocationError) {
		Toast.toast.danger("Failed to get geolocation");
	}

	if (isLoading || !coords) {
		return <Loader />;
	}

	return (
		<div className="relative w-full h-screen">
			<Map center={[coords.long, coords.lat]} zoom={14}>
				<PulseMarker coords={coords} type="emergency" />
				{/*{pulses.map((p) => {
					const position = p.position as any;
					return (
						<PulseMarker
							key={p.id}
							coords={{ lat: position.y, long: position.x }}
							type={p.type === PulseEnum.Emergency ? "emergency" : "warning"}
						/>
					);
				})}*/}
			</Map>
			<Button
				className="absolute top-4 right-4 z-10"
				variant="secondary"
				startContent={<PlusSquare className="size-4" />}
				onPress={handleClick}
			>
				Create pulse
			</Button>
		</div>
	);
};
