import { dash } from "@better-auth/infra";
import { getMailer } from "@server/mailers/getMailer";
import { OTPMail } from "@server/mailers/templates/OTPMail";
import { logger } from "@server/utils/Logger";
import bcrypt from "bcryptjs";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { emailOTP, openAPI } from "better-auth/plugins";
import { db } from "../../db";
import { account, session, user, verification } from "../../db/schema";
import { signUpPlugin } from "./plugins/signUpPlugin";

export const auth = betterAuth({
	appName: "UrbanPulse",
	logger: {
		disableColors: false,
		disabled: false,
		level: "debug",
		log: (level, message, ...args) => {
			if (level === "error") {
				console.error(
					`[AUTH_ERROR] ${message}`,
					args.length ? JSON.stringify(args, null, 2) : "",
				);
			} else {
				console.log(`[AUTH_${level.toUpperCase()}] ${message}`);
			}
		},
	},
	database: drizzleAdapter(db, {
		provider: "pg",
		schema: {
			user,
			session,
			account,
			verification,
		},
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
	socialProviders: {
		github: {
			clientId: Bun.env.GITHUB_CLIENT_ID,
			clientSecret: Bun.env.GITHUB_CLIENT_SECRET,
		},
		google: {
			clientId: Bun.env.GOOGLE_CLIENT_ID,
			clientSecret: Bun.env.GOOGLE_CLIENT_SECRET,
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
	cookieCache: {
		enabled: true,
		strategy: "jwe",
	},
	rateLimit: {
		max: 5,
		window: 60 * 1000,
	},
	plugins: [
		dash(),
		signUpPlugin(),
		openAPI(),
		emailOTP({
			storeOTP: "hashed",
			otpLength: 6,
			expiresIn: 300,
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
				if (type === "forget-password") {
					const targetMail = email.trim();
					logger.info(`Sending forget password OTP to ${targetMail}: ${otp}`);
					const mailer = getMailer();
					await mailer.send({
						to: targetMail,
						subject: "Forget Password OTP",
						html: OTPMail({ otp }),
					});
				}
			},
		}),
	],
});

export default auth;
