import { Hono } from "hono";
import { userService } from "@server/services/UserService";
export const userController = new Hono().get("/verify-email", async (c) => {
	try {
		const email = c.req.query("email");
		const response = await userService.verifyUserExists(email || "");
		if (!response) {
			return c.json({ exists: false }, 200);
		}
		return c.json({ exists: true }, 200);
	} catch (e) {
		return c.json({ message: "Internal server error" }, 500);
	}
});
