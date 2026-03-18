import { Seeder } from "@jorgebodega/typeorm-seeding";
import type { DataSource } from "typeorm";
import { UserEntity } from "@server/entities/UserEntity";
import { UserRole } from "@server/types";

export class UserSeeder extends Seeder {
	async run(dataSource: DataSource): Promise<void> {
		const em = dataSource.createEntityManager();

		await em.save(UserEntity, [
			{
				id: crypto.randomUUID(),
				name: "Alice Johnson",
				email: "alice.johnson@example.com",
				emailVerified: true,
				image: "https://i.pravatar.cc/150?u=alice",
				createdAt: new Date("2024-01-10T08:00:00Z"),
				updatedAt: new Date("2024-06-15T12:00:00Z"),
				role: UserRole.ADMIN,
				bio: "Platform administrator and full-stack developer.",
				trustScore: 4.95,
				successfulInteractions: 312,
				isVerified: true,
				rememberMe: false,
			},
			{
				id: crypto.randomUUID(),
				name: "Bob Martinez",
				email: "bob.martinez@example.com",
				emailVerified: true,
				image: "https://i.pravatar.cc/150?u=bob",
				createdAt: new Date("2024-02-14T09:30:00Z"),
				updatedAt: new Date("2024-07-01T10:00:00Z"),
				role: UserRole.USER,
				bio: "Frontend engineer passionate about UX.",
				trustScore: 3.8,
				successfulInteractions: 87,
				isVerified: true,
				rememberMe: true,
			},
			{
				id: crypto.randomUUID(),
				name: "Clara Nguyen",
				email: "clara.nguyen@example.com",
				emailVerified: false,
				image: null,
				createdAt: new Date("2024-03-05T14:00:00Z"),
				updatedAt: new Date("2024-03-05T14:00:00Z"),
				role: UserRole.USER,
				bio: null,
				trustScore: 0,
				successfulInteractions: 0,
				isVerified: false,
				rememberMe: false,
			},
			{
				id: crypto.randomUUID(),
				name: "David Kim",
				email: "david.kim@example.com",
				emailVerified: true,
				image: "https://i.pravatar.cc/150?u=david",
				createdAt: new Date("2024-01-20T11:00:00Z"),
				updatedAt: new Date("2024-08-10T09:00:00Z"),
				role: UserRole.USER,
				bio: "Data scientist with a focus on ML pipelines.",
				trustScore: 4.2,
				successfulInteractions: 154,
				isVerified: true,
				rememberMe: false,
			},
			{
				id: crypto.randomUUID(),
				name: "Eva Rossi",
				email: "eva.rossi@example.com",
				emailVerified: true,
				image: "https://i.pravatar.cc/150?u=eva",
				createdAt: new Date("2024-04-18T16:45:00Z"),
				updatedAt: new Date("2024-09-02T08:30:00Z"),
				role: UserRole.USER,
				bio: "DevOps engineer specializing in cloud infrastructure.",
				trustScore: 3.6,
				successfulInteractions: 63,
				isVerified: false,
				rememberMe: true,
			},
		]);
	}
}
