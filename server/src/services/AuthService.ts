import { betterAuth } from "better-auth";
import { openAPI } from "better-auth/plugins";
import { Pool } from "pg";
import { pe } from "..";
export const authService = betterAuth({
	logger: {
		disableColors: false,
		disabled: false,
		level: "error",
		log: (level, message, ...args) => {
			console.error(pe.render(`[${level}] ${message}`, ...args));
		},
	},
	database: new Pool({
		connectionString: Bun.env.DATABASE_URL,
	}),
	advanced: {
		defaultCookieAttributes: {
			httpOnly: true,
			secure: true,
		},
	},
	baseURL: Bun.env.BETTER_AUTH_URL,
	trustedOrigins: [Bun.env.SERVER_URL],
	session: {
		expiresIn: 60 * 60 * 24 * 30,
		updateAge: 60 * 60 * 24,
		cookieCache: {
			enabled: true,
			maxAge: 5 * 60,
		},
	},
	emailAndPassword: {
		enabled: true,
		requireEmailVerification: false,
		autoSignIn: true,
	},
	rateLimit: {
		max: 5,
		window: 60 * 1000,
	},
	plugins: [openAPI()],
});

export default authService;
