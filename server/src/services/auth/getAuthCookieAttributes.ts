import type { CookieOptions } from "better-call";

export const getAuthCookieAttributes = (
	nodeEnv: string | undefined,
): CookieOptions => ({
	httpOnly: true,
	secure: nodeEnv === "production",
	sameSite: nodeEnv === "production" ? "none" : "lax",
});
