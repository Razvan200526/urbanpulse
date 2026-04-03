import { getMailer } from "@server/mailers/getMailer";
import { OTPMail } from "@server/mailers/templates/OTPMail";
import { getAllowedOrigins } from "@server/utils/getAllowedOrigins";
import { logger } from "@server/utils/Logger";
import { userAdditionalFields } from "@shared/auth/userAdditionalFields";
import bcrypt from "bcryptjs";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { emailOTP, openAPI } from "better-auth/plugins";
import { db } from "../../db";
import { account, session, user, verification } from "../../db/schema";
import { getAuthCookieAttributes } from "./getAuthCookieAttributes";
// import { signUpPlugin } from "./plugins/signUpPlugin";
export const auth = betterAuth({
	appName: "UrbanPulse",
	logger: {
		disableColors: false,
		disabled: false,
		level: "debug",
		log: (level, message, ...args) => {
			if (level === "error") {
				logger.error(
					`[AUTH_ERROR] ${message},
					${args.length ? JSON.stringify(args, null, 2) : ""}`,
				);
			} else {
				logger.info(`[AUTH_${level.toUpperCase()}] ${message}`);
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
		additionalFields: userAdditionalFields,
	},
	advanced: {
		defaultCookieAttributes: getAuthCookieAttributes(Bun.env.NODE_ENV),
	},
	baseURL: Bun.env.BETTER_AUTH_URL,
	trustedOrigins: getAllowedOrigins(),
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
		max: 2000,
		window: 60 * 1000,
	},
	plugins: [
		openAPI(),
		emailOTP({
			storeOTP: "hashed",
			otpLength: 6,
			expiresIn: 300,
			allowedAttempts: 5,
			sendVerificationOnSignUp: true,
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
