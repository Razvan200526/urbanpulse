const splitOrigins = (value: string | undefined) => {
	return (value ?? "")
		.split(",")
		.map((origin) => origin.trim().replace(/\/+$/, ""))
		.filter(Boolean);
};

export const getAllowedOrigins = () => {
	return Array.from(
		new Set([
			...splitOrigins(Bun.env.CLIENT_URL),
			...splitOrigins(Bun.env.SERVER_URL),
		]),
	);
};

export const getCorsOrigin = (origin: string) => {
	const normalizedOrigin = origin.trim().replace(/\/+$/, "");
	if (!normalizedOrigin) {
		return "";
	}

	return getAllowedOrigins().includes(normalizedOrigin) ? normalizedOrigin : "";
};
