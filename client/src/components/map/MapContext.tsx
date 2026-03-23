import type { Map as MapboxMap } from "mapbox-gl";
import { createContext, useContext } from "react";

export const MapContext = createContext<MapboxMap | null>(null);

export const useMap = () => {
	const context = useContext(MapContext);
	return context;
};
