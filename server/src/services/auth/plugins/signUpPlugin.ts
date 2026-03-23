import { logger } from "@server/utils/Logger";
import type { BetterAuthPlugin } from "better-auth";
import { APIError, createAuthEndpoint } from "better-auth/api";
import * as z from "zod";

export const signUpPlugin = () => {
	return {
		id: "sign-up-plugin",
		endpoints: {
			signUpEmail: createAuthEndpoint(
				"/sign-up/email",
				{
					method: "POST",
					body: z.object({
						email: z.email(),
						password: z.string().min(8),
						name: z.string(),
						bio: z.string().optional(),
						image: z.string().optional(),
					}),
				},
				async (ctx) => {
					const { email, name, bio, image, password: userPassword } = ctx.body;
					logger.info(`Signing up user: ${email} (Name: ${name})`);
					const { adapter, password, internalAdapter, authCookies, secret } =
						ctx.context;

					const hashedPassword = await password.hash(userPassword);

					const existingUser = await adapter.findOne({
						model: "user",
						where: [{ field: "email", value: email }],
					});

					if (existingUser) {
						throw new APIError("CONFLICT", {
							message: "User already exists",
						});
					}

					const user = await adapter.create({
						model: "user",
						data: {
							email,
							name,
							bio,
							image,
							emailVerified: false,
							createdAt: new Date(),
							updatedAt: new Date(),
						},
					});

					await adapter.create({
						model: "account",
						data: {
							userId: user.id,
							accountId: user.id,
							providerId: "credential",
							password: hashedPassword,
							createdAt: new Date(),
							updatedAt: new Date(),
						},
					});

					const session = await internalAdapter.createSession(user.id, true);

					await ctx.setSignedCookie(
						authCookies.sessionToken.name,
						session.token,
						secret,
						{
							...authCookies.sessionToken.attributes,
							expires: session.expiresAt,
						},
					);

					logger.info(`User account created successfully for ID: ${user.id}`);

					return ctx.json({
						user,
						token: session.token,
					});
				},
			),
		},
	} satisfies BetterAuthPlugin;
};
