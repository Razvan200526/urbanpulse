import { describe, expect, test } from "bun:test";
import { buildSignUpPayload } from "./signUpPayload";

describe("buildSignUpPayload", () => {
	test("trims profile fields before signup requests are sent", () => {
		expect(
			buildSignUpPayload({
				email: "user@example.com",
				password: "Password123!",
				name: "  Casey  ",
				image: "  https://cdn.example.com/avatar.png  ",
				bio: "  Ready to help the neighborhood.  ",
			}),
		).toEqual({
			email: "user@example.com",
			password: "Password123!",
			name: "Casey",
			image: "https://cdn.example.com/avatar.png",
			bio: "Ready to help the neighborhood.",
		});
	});
});
