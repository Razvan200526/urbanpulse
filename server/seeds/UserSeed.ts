import { Seeder } from "@jorgebodega/typeorm-seeding";
import { UserEntity } from "@server/entities/UserEntity";
import { primaryDatabase } from "@server/shared/PrimaryDatabase";
import { UserRole } from "@server/types";

/**
 * Use the db:seed script to run this,it will fill up the database with new users
 */
export class UserSeeder extends Seeder {
	async run(): Promise<void> {
		const users: UserEntity[] = [
			new UserEntity({
				id: crypto.randomUUID(),
				name: "Alice Johnson",
				email: "alice.johnson@example.com",
				emailVerified: true,
				image: "https://i.pravatar.cc/150?u=alice",
				createdAt: new Date("2024-01-10T08:00:00Z"),
				updatedAt: new Date("2024-06-15T12:00:00Z"),
				role: UserRole.ADMIN,
				pulses: [],
				bio: "Platform administrator and full-stack developer.",
				trustScore: 4.95,
				successfulInteractions: 312,
				skills: ["TypeScript", "Node.js", "PostgreSQL"],
				resources: ["admin-panel", "analytics-dashboard"],
				isVerified: true,
				rememberMe: false,
			}),
			new UserEntity({
				id: crypto.randomUUID(),
				name: "Bob Martinez",
				email: "bob.martinez@example.com",
				emailVerified: true,
				image: "https://i.pravatar.cc/150?u=bob",
				createdAt: new Date("2024-02-14T09:30:00Z"),
				updatedAt: new Date("2024-07-01T10:00:00Z"),
				role: UserRole.USER,
				pulses: [],
				bio: "Frontend engineer passionate about UX.",
				trustScore: 3.8,
				successfulInteractions: 87,
				skills: ["React", "CSS", "Figma"],
				resources: ["design-assets"],
				isVerified: true,
				rememberMe: true,
			}),
			new UserEntity({
				id: crypto.randomUUID(),
				name: "Clara Nguyen",
				email: "clara.nguyen@example.com",
				emailVerified: false,
				image: null,
				createdAt: new Date("2024-03-05T14:00:00Z"),
				updatedAt: new Date("2024-03-05T14:00:00Z"),
				role: UserRole.USER,
				pulses: [],
				bio: undefined,
				trustScore: 0,
				successfulInteractions: 0,
				skills: [],
				resources: [],
				isVerified: false,
				rememberMe: false,
			}),
			new UserEntity({
				id: crypto.randomUUID(),
				name: "David Kim",
				email: "david.kim@example.com",
				emailVerified: true,
				image: "https://i.pravatar.cc/150?u=david",
				createdAt: new Date("2024-01-20T11:00:00Z"),
				updatedAt: new Date("2024-08-10T09:00:00Z"),
				role: UserRole.USER,
				pulses: [],
				bio: "Data scientist with a focus on ML pipelines.",
				trustScore: 4.2,
				successfulInteractions: 154,
				skills: ["Python", "TensorFlow", "SQL"],
				resources: ["ml-notebooks", "dataset-registry"],
				isVerified: true,
				rememberMe: false,
			}),
			new UserEntity({
				id: crypto.randomUUID(),
				name: "Eva Rossi",
				email: "eva.rossi@example.com",
				emailVerified: true,
				image: "https://i.pravatar.cc/150?u=eva",
				createdAt: new Date("2024-04-18T16:45:00Z"),
				updatedAt: new Date("2024-09-02T08:30:00Z"),
				role: UserRole.USER,
				pulses: [],
				bio: "DevOps engineer specializing in cloud infrastructure.",
				trustScore: 3.6,
				successfulInteractions: 63,
				skills: ["AWS", "Docker", "Terraform"],
				resources: ["infra-templates"],
				isVerified: false,
				rememberMe: true,
			}),
		];

		await primaryDatabase
			.getSource()
			.createEntityManager()
			.save<UserEntity>(users);
	}
}
