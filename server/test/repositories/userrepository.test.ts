import { beforeEach, describe, expect, test } from "bun:test";
import { userRepository } from "@server/repositories/UserRepository";
import { createUser } from "../helpers/fixtures";
import { resetDatabase } from "../helpers/testDatabase";

describe("UserRepository", () => {
	beforeEach(resetDatabase);

	test("supports CRUD operations", async () => {
		expect(await userRepository.getOne("missing")).toBeNull();

		const created = await userRepository.create({
			id: "user-repo-1",
			name: "Alice",
			email: "alice@example.com",
			emailVerified: true,
			createdAt: new Date("2025-01-01T00:00:00.000Z"),
			updatedAt: new Date("2025-01-01T00:00:00.000Z"),
		});

		expect(created).not.toBeNull();
		expect((await userRepository.getOne("user-repo-1"))?.email).toBe(
			"alice@example.com",
		);
		expect((await userRepository.getAll()).map((user) => user.id)).toEqual([
			"user-repo-1",
		]);

		const updated = await userRepository.update("user-repo-1", {
			name: "Alice Updated",
		});
		expect(updated.name).toBe("Alice Updated");
		expect(userRepository.update("missing", { name: "Nope" })).rejects.toThrow(
			"User with id missing not found",
		);

		expect(await userRepository.delete("user-repo-1")).toBe(true);
		expect(await userRepository.delete("user-repo-1")).toBe(false);
	});

	test("finds users by email", async () => {
		const user = await createUser({ email: "search@example.com" });

		expect((await userRepository.findByEmail("search@example.com"))?.id).toBe(
			user.id,
		);
		expect(await userRepository.findByEmail("missing@example.com")).toBeNull();
	});
});
