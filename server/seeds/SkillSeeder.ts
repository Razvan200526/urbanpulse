// import { Seeder } from "@jorgebodega/typeorm-seeding";
// import type { DataSource } from "typeorm";
// import { UserEntity } from "@server/entities/UserEntity";
// import { SkillEntity } from "@server/entities/SkillEntity";

// export class SkillSeeder extends Seeder {
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

// 		await em.save(SkillEntity, [
// 			{
// 				id: crypto.randomUUID(),
// 				tag: "TypeScript",
// 				user: { id: u["Alice Johnson"]?.id } as UserEntity,
// 			},
// 			{
// 				id: crypto.randomUUID(),
// 				tag: "Node.js",
// 				user: { id: u["Alice Johnson"]?.id } as UserEntity,
// 			},
// 			{
// 				id: crypto.randomUUID(),
// 				tag: "PostgreSQL",
// 				user: { id: u["Alice Johnson"]?.id } as UserEntity,
// 			},
// 			{
// 				id: crypto.randomUUID(),
// 				tag: "React",
// 				user: { id: u["Bob Martinez"]?.id } as UserEntity,
// 			},
// 			{
// 				id: crypto.randomUUID(),
// 				tag: "CSS",
// 				user: { id: u["Bob Martinez"]?.id } as UserEntity,
// 			},
// 			{
// 				id: crypto.randomUUID(),
// 				tag: "Figma",
// 				user: { id: u["Bob Martinez"]?.id } as UserEntity,
// 			},
// 			{
// 				id: crypto.randomUUID(),
// 				tag: "Python",
// 				user: { id: u["David Kim"]?.id } as UserEntity,
// 			},
// 			{
// 				id: crypto.randomUUID(),
// 				tag: "TensorFlow",
// 				user: { id: u["David Kim"]?.id } as UserEntity,
// 			},
// 			{
// 				id: crypto.randomUUID(),
// 				tag: "SQL",
// 				user: { id: u["David Kim"]?.id } as UserEntity,
// 			},
// 			{
// 				id: crypto.randomUUID(),
// 				tag: "AWS",
// 				user: { id: u["Eva Rossi"]?.id } as UserEntity,
// 			},
// 			{
// 				id: crypto.randomUUID(),
// 				tag: "Docker",
// 				user: { id: u["Eva Rossi"]?.id } as UserEntity,
// 			},
// 			{
// 				id: crypto.randomUUID(),
// 				tag: "Terraform",
// 				user: { id: u["Eva Rossi"]?.id } as UserEntity,
// 			},
// 		]);
// 	}
// }
