const trimTrailingSlashes = (value: string | undefined | null) =>
	(value ?? "").trim().replace(/\/+$/, "");

const normalizePath = (path: string) => {
	if (!path) {
		return "/";
	}

	return path.startsWith("/") ? path : `/${path}`;
};

type ResolveOriginOptions = {
	appOrigin?: string;
	browserOrigin?: string;
	edgeProxyEnabled?: boolean;
	serverOrigin?: string;
};

export const resolveAppOrigin = ({
	appOrigin,
	browserOrigin,
	serverOrigin,
}: ResolveOriginOptions = {}) =>
	trimTrailingSlashes(browserOrigin) ||
	trimTrailingSlashes(appOrigin) ||
	trimTrailingSlashes(serverOrigin);

export const resolveApiOrigin = ({
	appOrigin,
	browserOrigin,
	edgeProxyEnabled,
	serverOrigin,
}: ResolveOriginOptions = {}) => {
	if (edgeProxyEnabled) {
		return resolveAppOrigin({ appOrigin, browserOrigin, serverOrigin });
	}

	return (
		trimTrailingSlashes(serverOrigin) ||
		resolveAppOrigin({ appOrigin, browserOrigin, serverOrigin })
	);
};

export const resolveAiOrigin = ({
	appOrigin,
	browserOrigin,
	serverOrigin,
}: ResolveOriginOptions = {}) =>
	trimTrailingSlashes(serverOrigin) ||
	resolveAppOrigin({ appOrigin, browserOrigin, serverOrigin });

export const toWebSocketUrl = (url: string) => {
	if (url.startsWith("ws://") || url.startsWith("wss://")) {
		return url;
	}

	if (url.startsWith("http://")) {
		return url.replace("http://", "ws://");
	}

	if (url.startsWith("https://")) {
		return url.replace("https://", "wss://");
	}

	return `wss://${url}`;
};

const getBrowserOrigin = () =>
	typeof window !== "undefined" ? window.location.origin : undefined;

export const isEdgeProxyEnabled = () =>
	import.meta.env?.VITE_USE_EDGE_PROXY === "true";

export const getAppOrigin = () =>
	resolveAppOrigin({
		appOrigin: import.meta.env?.VITE_APP_URL,
		browserOrigin: getBrowserOrigin(),
		serverOrigin: import.meta.env?.VITE_SERVER_URL,
	});

export const getApiOrigin = () =>
	resolveApiOrigin({
		appOrigin: import.meta.env?.VITE_APP_URL,
		browserOrigin: getBrowserOrigin(),
		edgeProxyEnabled: isEdgeProxyEnabled(),
		serverOrigin: import.meta.env?.VITE_SERVER_URL,
	});

export const getAiOrigin = () =>
	resolveAiOrigin({
		appOrigin: import.meta.env?.VITE_APP_URL,
		browserOrigin: getBrowserOrigin(),
		serverOrigin:
			import.meta.env?.VITE_AI_URL || import.meta.env?.VITE_SERVER_URL,
	});

export const buildAppUrl = (path: string) =>
	`${getAppOrigin()}${normalizePath(path)}`;

export const buildApiUrl = (path: string) =>
	`${getApiOrigin()}${normalizePath(path)}`;

export const buildAiUrl = (path: string) =>
	`${getAiOrigin()}${normalizePath(path)}`;

export const buildApiWebSocketUrl = (path: string) =>
	toWebSocketUrl(buildApiUrl(path));

export const buildAiWebSocketUrl = (path: string) =>
	toWebSocketUrl(buildAiUrl(path));
