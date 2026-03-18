// server/src/entities/UserEntity.ts
import type { UserRole } from "@server/types";
import { Column, Entity, OneToMany, PrimaryColumn } from "typeorm";
import { PulseEntity } from "./PulseEntity";
import { QuietHoursEntity } from "./QuietHoursEntity";
import { ResourceEntity } from "./ResourceEntity";
import { SkillEntity } from "./SkillEntity";

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

	@Column({ type: "boolean", default: false })
	emailVerified: boolean;

	@Column({ type: "text", nullable: true })
	image: string | null;

	@Column({ type: "timestamptz", default: () => "CURRENT_TIMESTAMP" })
	createdAt: Date;

	@Column({ type: "timestamptz", default: () => "CURRENT_TIMESTAMP" })
	updatedAt: Date;

	@Column({ type: "text", nullable: true, default: "user" })
	role: UserRole | null;

	@Column({ type: "text", nullable: true })
	bio: string | null;

	@Column({ type: "float", nullable: true, default: 0 })
	trustScore: number;

	@Column({ type: "integer", nullable: true, default: 0 })
	successfulInteractions: number;

	@Column({ type: "boolean", nullable: true, default: false })
	isVerified: boolean;

	@Column({ type: "boolean", nullable: true, default: false })
	rememberMe: boolean;

	@OneToMany(
		() => PulseEntity,
		(pulse) => pulse.user,
	)
	pulses: PulseEntity[];

	@OneToMany(
		() => SkillEntity,
		(skill) => skill.user,
	)
	skills: SkillEntity[];

	@OneToMany(
		() => ResourceEntity,
		(resource) => resource.user,
	)
	resources: ResourceEntity[];

	@OneToMany(
		() => QuietHoursEntity,
		(quietHour) => quietHour.user,
	)
	quietHours: QuietHoursEntity[];
}
