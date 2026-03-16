import { UserRole } from "@server/types";
import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity({
	name: "user",
	synchronize: false,
})
export class UserEntity {
	@PrimaryColumn("uuid")
	id: string;

	@Column({ type: "varchar", length: 255 })
	name: string;

	@Column({ type: "varchar", length: 255, unique: true })
	email: string;

	@Column({ type: "boolean", default: false })
	emailVerified: boolean;

	@Column({ type: "varchar", nullable: true })
	image: string | null;

	@Column({ type: "timestamp" })
	createdAt: Date;

	@Column({ type: "timestamp" })
	updatedAt: Date;

	@Column({
		type: "enum",
		enum: UserRole,
		default: UserRole.USER,
	})
	role: UserRole;

	@Column({ type: "varchar", length: 100, nullable: true })
	bio: string;

	@Column({ type: "decimal", precision: 3, scale: 2, default: 0 })
	trustScore: number;

	@Column({ type: "int", default: 0 })
	successfulInteractions: number;

	@Column({ type: "simple-array", nullable: true })
	skills: string[];

	@Column({ type: "simple-array", nullable: true })
	resources: string[];

	@Column({ type: "boolean", default: false })
	isVerified: boolean;

	@Column({ type: "boolean", default: false })
	rememberMe: boolean;
}
