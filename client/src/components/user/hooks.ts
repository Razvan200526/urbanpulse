import { useQuery } from "@tanstack/react-query";

export const useGetAddress = (lat?: number, long?: number) => {
	return useQuery({
		queryKey: ["address", lat, long],
		queryFn: async () => {
			if (lat === undefined || long === undefined) return null;

			const res = await fetch(
				`https://api.mapbox.com/geocoding/v5/mapbox.places/${long},${lat}.json?access_token=${import.meta.env.VITE_MAPBOX_GL_ACCESS_TOKEN}`,
			);

			const data = await res.json();

			if (data.features && data.features.length > 0) {
				return data.features[0].place_name;
			}
			return null;
		},
		enabled: lat !== undefined && long !== undefined,
	});
};
