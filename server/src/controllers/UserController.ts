import { zValidator } from "@hono/zod-validator";
import { userService } from "@server/services/UserService";
import { emailSchema } from "@shared/validators/isEmailValid";
import { Hono } from "hono";
export const userController = new Hono().get(
	"/verify-email",
	zValidator("query", emailSchema),
	async (c) => {
		const { email } = c.req.valid("query");
		if (!email) {
			return c.json(
				{
					success: false,
					message: "Email query parameter is required",
					exists: false,
				},
				400,
			);
		}
		const response = await userService.verifyUserExists(email);
		if (!response) {
			return c.json(
				{ success: true, message: "User not found", exists: false },
				200,
			);
		}
		return c.json(
			{ success: true, exists: true, message: "User already exists" },
			200,
		);
	},
);
