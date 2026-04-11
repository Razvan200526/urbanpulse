import { useEffect, useState } from "react";

const supportsMatchMedia = () =>
	typeof window !== "undefined" && typeof window.matchMedia === "function";

export const useMediaQuery = (query: string) => {
	const [matches, setMatches] = useState(() => {
		return supportsMatchMedia() ? window.matchMedia(query).matches : false;
	});

	useEffect(() => {
		if (!supportsMatchMedia()) {
			return;
		}

		const mediaQueryList = window.matchMedia(query);
		const updateMatch = () => setMatches(mediaQueryList.matches);

		updateMatch();
		mediaQueryList.addEventListener("change", updateMatch);

		return () => {
			mediaQueryList.removeEventListener("change", updateMatch);
		};
	}, [query]);

	return matches;
};

export const useIsMobile = () => {
	return useMediaQuery("(max-width: 767px)");
};

export const useIs2xl = () => {
	return useMediaQuery("(min-width: 1536px)");
};
