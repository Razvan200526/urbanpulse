import { zValidator } from "@hono/zod-validator";
import { authMiddleware } from "@server/middleware/authMiddleware";
import { userService } from "@server/services/UserService";
import { emailSchema } from "@shared/validators/isEmailValid";
import {
	quietHoursUpsertSchema,
	skillTagsUpdateSchema,
	userProfileUpdateSchema,
} from "@shared/validators/users/isUserProfileValid";
import { Hono } from "hono";
export const userController = new Hono()
	.basePath("/users")
	.get("/verify-email", zValidator("query", emailSchema), async (c) => {
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
	})
	.get("/me", authMiddleware, async (c) => {
		const user = c.get("user");
		if (!user) {
			return c.json({ user: null, message: "Unauthorized" }, 401);
		}
		return c.json({ user, message: "User found" }, 201);
	})
	.get("/profile", authMiddleware, async (c) => {
		const session = c.get("session");
		if (!session) {
			return c.json(
				{ success: false, message: "Unauthorized", data: null },
				401,
			);
		}

		const profile = await userService.getProfile(session.userId);
		if (!profile) {
			return c.json(
				{ success: false, message: "Profile not found", data: null },
				404,
			);
		}

		return c.json({
			success: true,
			message: "Profile retrieved",
			data: profile,
		});
	})
	.patch(
		"/profile",
		authMiddleware,
		zValidator("json", userProfileUpdateSchema),
		async (c) => {
			const session = c.get("session");
			if (!session) {
				return c.json(
					{ success: false, message: "Unauthorized", data: null },
					401,
				);
			}

			const updated = await userService.updateProfile(
				session.userId,
				c.req.valid("json"),
			);
			if (!updated) {
				return c.json(
					{ success: false, message: "Failed to update profile", data: null },
					400,
				);
			}

			return c.json({
				success: true,
				message: "Profile updated",
				data: updated,
			});
		},
	)
	.put(
		"/quiet-hours",
		authMiddleware,
		zValidator("json", quietHoursUpsertSchema),
		async (c) => {
			const session = c.get("session");
			if (!session) {
				return c.json(
					{ success: false, message: "Unauthorized", data: null },
					401,
				);
			}

			const quietHours = await userService.upsertQuietHours(
				session.userId,
				c.req.valid("json"),
			);
			if (!quietHours) {
				return c.json(
					{ success: false, message: "Failed to save quiet hours", data: null },
					400,
				);
			}

			return c.json({
				success: true,
				message: "Quiet hours saved",
				data: quietHours,
			});
		},
	)
	.put(
		"/skills",
		authMiddleware,
		zValidator("json", skillTagsUpdateSchema),
		async (c) => {
			const session = c.get("session");
			if (!session) {
				return c.json(
					{ success: false, message: "Unauthorized", data: null },
					401,
				);
			}

			const tags = await userService.updateSkillTags(
				session.userId,
				c.req.valid("json"),
			);
			if (!tags) {
				return c.json(
					{
						success: false,
						message: "Failed to update skill tags",
						data: null,
					},
					400,
				);
			}

			return c.json({
				success: true,
				message: "Skill tags updated",
				data: { tags },
			});
		},
	)
	.delete("/account", authMiddleware, async (c) => {
		const session = c.get("session");
		if (!session) {
			return c.json(
				{ success: false, message: "Unauthorized", data: null },
				401,
			);
		}

		const deleted = await userService.deleteAccount(session.userId);
		if (!deleted) {
			return c.json(
				{ success: false, message: "Failed to delete account", data: null },
				400,
			);
		}

		return c.json({
			success: true,
			message: "Account deleted",
			data: null,
		});
	});
