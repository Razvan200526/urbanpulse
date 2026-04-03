type PagesEnv = {
	RAILWAY_API_ORIGIN?: string;
};

type PagesContext = {
	env: PagesEnv;
	request: Request;
};

type WebSocketResponseInit = ResponseInit & {
	webSocket: WebSocket;
};

const trimTrailingSlashes = (value: string) => value.replace(/\/+$/, "");

const getUpstreamUrl = (request: Request, upstreamOrigin: string) => {
	const incomingUrl = new URL(request.url);
	return new URL(
		`${trimTrailingSlashes(upstreamOrigin)}${incomingUrl.pathname}${incomingUrl.search}`,
	);
};

const getProxyHeaders = (request: Request) => {
	const incomingUrl = new URL(request.url);
	const headers = new Headers(request.headers);

	headers.delete("host");
	headers.set("x-forwarded-host", incomingUrl.host);
	headers.set("x-forwarded-proto", incomingUrl.protocol.replace(":", ""));

	const clientIp = request.headers.get("cf-connecting-ip");
	if (clientIp) {
		headers.set("x-forwarded-for", clientIp);
		headers.set("x-real-ip", clientIp);
	}

	return headers;
};

export const onRequest = async ({ env, request }: PagesContext) => {
	if (!env.RAILWAY_API_ORIGIN) {
		return new Response("Missing RAILWAY_API_ORIGIN", { status: 500 });
	}

	const upstreamUrl = getUpstreamUrl(request, env.RAILWAY_API_ORIGIN);
	const headers = getProxyHeaders(request);
	const upstreamResponse = await fetch(upstreamUrl, {
		body:
			request.method === "GET" || request.method === "HEAD"
				? undefined
				: request.body,
		headers,
		method: request.method,
		redirect: "manual",
	});

	const webSocket = (
		upstreamResponse as Response & {
			webSocket?: WebSocket | null;
		}
	).webSocket;

	if (webSocket) {
		const responseInit: WebSocketResponseInit = {
			headers: upstreamResponse.headers,
			status: 101,
			webSocket,
		};

		return new Response(null, responseInit);
	}

	return new Response(upstreamResponse.body, {
		headers: upstreamResponse.headers,
		status: upstreamResponse.status,
		statusText: upstreamResponse.statusText,
	});
};
