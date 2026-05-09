const decodePathSegment = (segment: string) => {
	try {
		return decodeURIComponent(segment);
	} catch {
		return segment;
	}
};

export const normalizeAssetUrl = (url: string) => {
	if (!url || url.startsWith("blob:") || url.startsWith("data:")) {
		return url;
	}

	const match = url.match(/^(https?:\/\/[^/]+)(\/[^?]*)?(\?.*)?$/i);
	if (!match) {
		return url;
	}

	const [, origin, rawPathname = "", search = ""] = match;
	const collapsedPathname = rawPathname.replace(/\/{2,}/g, "/");
	const encodedPathname = collapsedPathname
		.split("/")
		.map((segment, index) =>
			index === 0 ? segment : encodeURIComponent(decodePathSegment(segment)),
		)
		.join("/");

	return `${origin}${encodedPathname}${search}`;
};
