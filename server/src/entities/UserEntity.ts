import { UserRole } from "@server/types";
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({
	name: "user",
})
export class UserEntity {
	@PrimaryGeneratedColumn("uuid")
	id: string;

	@Column({ type: "varchar", length: 30 })
	firstName: string;

	@Column({ type: "varchar", length: 30 })
	lastName: string;

	@Column({ type: "varchar", length: 20 })
	email: string;

	@Column({
		type: "enum",
		enum: UserRole,
		default: UserRole.USER,
	})
	role: UserRole;

	@Column()
	image: string;

	@Column({ type: "varchar", length: 100 })
	bio: string;

	@Column({ type: "decimal", precision: 3, scale: 2, default: 0 })
	trustScore: number;

	@Column({ type: "int", default: 0 })
	successfulInteractions: number;

	@Column({ type: "simple-array", nullable: true })
	skills: string[]; // Tags: ['plumbing', 'lifting', 'nursing']

	@Column({ type: "simple-array", nullable: true })
	resources: string[];

	@Column({ type: "boolean" })
	isVerified: boolean;

	@Column({ type: "boolean" })
	rememberMe: boolean;
}
