import { userService } from "@server/services/UserService";
import { handleError } from "@server/utils/handleError";
import { Hono } from "hono";
export const userController = new Hono().get("/verify-email", async (c) => {
	try {
		const email = c.req.query("email");
		if (!email) {
			return c.json({ message: "Email query parameter is required" }, 400);
		}
		const response = await userService.verifyUserExists(email || "");
		if (!response) {
			return c.json({ exists: false }, 200);
		}
		return c.json({ exists: true }, 200);
	} catch (e) {
		handleError(e);
		console.error(e);
		return c.json({ message: "Internal server errorasda" }, 500);
	}
});
