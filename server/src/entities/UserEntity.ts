import type { UserRole } from "@server/types";
import { Column, Entity, OneToMany, PrimaryColumn } from "typeorm";
import { PulseEntity } from "./PulseEntity";

@Entity({
	name: "user",
	synchronize: false,
})
export class UserEntity {
	constructor(partial?: Partial<UserEntity>) {
		if (partial) Object.assign(this, partial);
	}
	@PrimaryColumn("text")
	id: string;

	@Column({ type: "text" })
	name: string;

	@Column({ type: "text", unique: true })
	email: string;

	@Column({ type: "boolean" })
	emailVerified: boolean;

	@Column({ type: "text", nullable: true })
	image: string | null;

	@Column({ type: "timestamptz" })
	createdAt: Date;

	@Column({ type: "timestamptz" })
	updatedAt: Date;

	@Column({
		type: "text",
		nullable: true,
	})
	role: UserRole;

	@OneToMany(
		() => PulseEntity,
		(pulse) => pulse.user,
	)
	pulses: PulseEntity[];

	@Column({ type: "text", nullable: true })
	bio: string | null;

	@Column({ type: "float", default: 0 })
	trustScore: number;

	@Column({ type: "int", default: 0 })
	successfulInteractions: number;

	@Column({ type: "text", nullable: true })
	skills: string[];

	@Column({ type: "text", nullable: true })
	resources: string[];

	@Column({ type: "boolean", nullable: true })
	isVerified: boolean;

	@Column({ type: "boolean", nullable: true })
	rememberMe: boolean;
}
