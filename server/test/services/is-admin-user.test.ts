import { describe, expect, test } from "bun:test";
import {
	applyAdminUserRole,
	isAdminUser,
} from "@server/services/auth/utils/isAdminUser";
import { UserRole } from "@server/types";

describe("isAdminUser", () => {
	test("matches the built-in admin allowlist regardless of case or spacing", () => {
		expect(isAdminUser("  CALINRAZVANANDREI26@gmail.com ")).toBe(true);
		expect(isAdminUser("doruippu@gmail.com")).toBe(true);
		expect(isAdminUser("neighbor@example.com")).toBe(false);
	});

	test("matches additional admin emails from ADMIN_USER_EMAILS", () => {
		const previousValue = Bun.env.ADMIN_USER_EMAILS;
		Bun.env.ADMIN_USER_EMAILS = "mod@urbanpulse.local, ops@urbanpulse.local ";

		try {
			expect(isAdminUser("ops@urbanpulse.local")).toBe(true);
			expect(isAdminUser("MOD@urbanpulse.local")).toBe(true);
		} finally {
			if (previousValue === undefined) {
				delete Bun.env.ADMIN_USER_EMAILS;
			} else {
				Bun.env.ADMIN_USER_EMAILS = previousValue;
			}
		}
	});
});

describe("applyAdminUserRole", () => {
	test("promotes allowlisted users to admin without demoting existing admins", () => {
		expect(
			applyAdminUserRole("calinrazvanandrei26@gmail.com", UserRole.USER),
		).toBe(UserRole.ADMIN);
		expect(applyAdminUserRole("neighbor@example.com", UserRole.ADMIN)).toBe(
			UserRole.ADMIN,
		);
		expect(applyAdminUserRole("neighbor@example.com")).toBe(UserRole.USER);
	});
});
