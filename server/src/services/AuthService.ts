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
	user: {
		modelName: "user",
		fields: {
			email: "email",
			image: "image",
		},
		additionalFields: {
			name: {
				type: "string",
				required: true,
			},
			role: {
				type: "string",
				required: false,
			},
			bio: {
				type: "string",
				required: false,
			},
			trustScore: {
				type: "number",
				required: false,
			},
			successfulInteractions: {
				type: "number",
				required: false,
			},
			skills: {
				type: "string",
				required: false,
			},
			resources: {
				type: "string",
				required: false,
			},
			isVerified: {
				type: "boolean",
				required: false,
			},
			rememberMe: {
				type: "boolean",
				required: false,
			},
		},
	},
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
