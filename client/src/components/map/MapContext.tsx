import { createContext, useContext } from "react";
import type { Map as MapboxMap } from "mapbox-gl";

export const MapContext = createContext<MapboxMap | null>(null);

export const useMap = () => {
	const context = useContext(MapContext);
	return context;
};
