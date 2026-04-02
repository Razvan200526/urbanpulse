import type { Variables } from "@server/app";
import auth from "@server/services/auth/AuthService";
import { logger } from "@server/utils/Logger";
import type { Context, Next } from "hono";

const publicPaths = ["/api/health", "/api/auth/", "/api/users/verify-email"];

const shouldBypassAuth = (method: string, path: string) => {
	if (method === "OPTIONS") {
		return true;
	}

	return publicPaths.some((publicPath) => path.startsWith(publicPath));
};

export const authMiddleware = async (
	c: Context<{ Variables: Variables }>,
	next: Next,
) => {
	if (shouldBypassAuth(c.req.method, c.req.path)) {
		c.set("user", null);
		c.set("session", null);
		await next();
		return;
	}

	try {
		const session = await auth.api.getSession({
			headers: c.req.raw.headers,
		});

		if (!session) {
			c.set("user", null);
			c.set("session", null);
			await next();
			return;
		}

		c.set("user", session.user);
		c.set("session", session.session);
		await next();
	} catch (error) {
		logger.error(
			`Failed to resolve session for ${c.req.method} ${c.req.path}: ${error instanceof Error ? error.message : String(error)}`,
		);
		c.set("user", null);
		c.set("session", null);
		await next();
	}
};
