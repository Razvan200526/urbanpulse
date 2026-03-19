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
					const { adapter, password } = ctx.context;

					const hashedPassword = await password.hash(userPassword);
					const id = crypto.randomUUID();

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
							id,
							email,
							name,
							bio,
							image,
							emailVerified: false,
							createdAt: new Date(),
							updatedAt: new Date(),
						},
					});

					const userAccount = await adapter.create({
						model: "account",
						data: {
							id: crypto.randomUUID(),
							userId: user.id,
							accountId: user.id,
							providerId: "credential",
							password: hashedPassword,
							createdAt: new Date(),
							updatedAt: new Date(),
						},
					});
					logger.info(`User account created : ${JSON.stringify(userAccount)}`);

					return ctx.json({
						user,
						token: null,
					});
				},
			),
		},
	} satisfies BetterAuthPlugin;
};
