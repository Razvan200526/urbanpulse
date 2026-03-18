// import { Seeder } from "@jorgebodega/typeorm-seeding";
// import type { DataSource } from "typeorm";
// import { UserEntity } from "@server/entities/UserEntity";
// import { ResourceEntity } from "@server/entities/ResourceEntity";

// export class ResourceSeeder extends Seeder {
// 	async run(dataSource: DataSource): Promise<void> {
// 		const em = dataSource.createEntityManager();

// 		const users = await em.find(UserEntity, {
// 			where: [
// 				{ name: "Alice Johnson" },
// 				{ name: "Bob Martinez" },
// 				{ name: "David Kim" },
// 				{ name: "Eva Rossi" },
// 			],
// 		});

// 		const u = Object.fromEntries(users.map((u) => [u.name, u]));

// 		const resourceData: ResourceEntity[] = [
// 			{
// 				id: crypto.randomUUID(),
// 				name: "Admin Panel",
// 				userId: u["Alice Johnson"]?.id as string,
// 				availability: "Available",
// 				createdAt: new Date(),
// 				user: u["Alice Johnson"],
// 			},
// 			{
// 				id: crypto.randomUUID(),
// 				name: "Analytics Dashboard",
// 				userId: u["Alice Johnson"]?.id,
// 				availability: "Available",
// 				createdAt: new Date(),
// 			},
// 			{
// 				id: crypto.randomUUID(),
// 				name: "Design Assets",
// 				userId: u["Bob Martinez"]?.id,
// 				availability: "Available",
// 				createdAt: new Date(),
// 			},
// 			{
// 				id: crypto.randomUUID(),
// 				name: "ML Notebooks",
// 				user: { id: u["David Kim"]?.id } as UserEntity,
// 				availability: "Available",
// 				createdAt: new Date(),
// 			},
// 			{
// 				id: crypto.randomUUID(),
// 				name: "Dataset Registry",
// 				user: { id: u["David Kim"]?.id } as UserEntity,
// 				availability: "Available",
// 				createdAt: new Date(),
// 			},
// 			{
// 				id: crypto.randomUUID(),
// 				name: "Infra Templates",
// 				user: { id: u["Eva Rossi"]?.id } as UserEntity,
// 				availability: "Currently Unavailable",
// 				createdAt: new Date(),
// 			},
// 		];
// 		await em.save(ResourceEntity);
// 	}
// }
