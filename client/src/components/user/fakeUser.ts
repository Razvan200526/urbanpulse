import type { UserType } from "@server/db/schema";

export const fakeUser: UserType = {
	id: "user_123",
	name: "John Doe",
	email: "john.doe@example.com",
	emailVerified: true,
	image: null,
	createdAt: new Date("2024-01-01T00:00:00Z"),
	updatedAt: new Date("2024-01-02T00:00:00Z"),
	role: "admin",
	bio: "Just a fake user for testing.",
	trustScore: 95,
	successfulInteractions: 10,
	isVerified: true,
	rememberMe: false,
};
