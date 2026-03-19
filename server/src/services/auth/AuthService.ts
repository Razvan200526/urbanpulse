import { getMailer } from "@server/mailers/getMailer";
import { OTPMail } from "@server/mailers/templates/OTPMail";
import { logger } from "@server/utils/Logger";
import { pe } from "@server/utils/PrettyError";
import { betterAuth } from "better-auth";
import { emailOTP, openAPI } from "better-auth/plugins";
import { Pool } from "pg";
import { signUpPlugin } from "./plugins/signUpPlugin";
import bcrypt from "bcryptjs";

export const auth = betterAuth({
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
			name: "name",
		},
		additionalFields: {
			role: {
				type: "string",
				required: false,
				defaultValue: "user",
				input: false,
			},
			bio: {
				type: "string",
				required: false,
			},
			trustScore: {
				type: "number",
				required: false,
				defaultValue: 0,
				input: false,
			},
			successfulInteractions: {
				type: "number",
				required: false,
				defaultValue: 0,
				input: false,
			},
			isVerified: {
				type: "boolean",
				required: false,
				defaultValue: false,
				input: false,
			},
			rememberMe: {
				type: "boolean",
				required: false,
				defaultValue: false,
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
	trustedOrigins: [Bun.env.SERVER_URL, Bun.env.CLIENT_URL],
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
		password: {
			hash: async (password: string) => {
				return bcrypt.hash(password, 10);
			},
			verify: async ({ password, hash }) => {
				return await bcrypt.compare(password, hash);
			},
		},
		requireEmailVerification: false,
		autoSignIn: true,
	},
	rateLimit: {
		max: 5,
		window: 60 * 1000,
	},
	plugins: [
		signUpPlugin(),
		openAPI(),
		emailOTP({
			otpLength: 6,
			expiresIn: 3600,
			allowedAttempts: 5,
			sendVerificationOnSignUp: true,
			// overrideDefaultEmailVerification: true,
			sendVerificationOTP: async ({ email, otp, type }) => {
				if (type === "email-verification") {
					const targetEmail = email.trim();
					logger.info(`Sending verification OTP to ${targetEmail}: ${otp}`);
					const mailer = getMailer();
					await mailer.send({
						to: targetEmail,
						subject: "Verification OTP",
						html: OTPMail({ otp }),
					});
				}
			},
		}),
	],
});

export default auth;
