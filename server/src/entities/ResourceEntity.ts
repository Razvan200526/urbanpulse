import { Column, Entity, ManyToOne, PrimaryColumn, RelationId } from "typeorm";
import { UserEntity } from "./UserEntity";
import type { ResourceAvailabilityType } from "@shared/types";

@Entity({
	name: "resources",
})
export class ResourceEntity {
	@PrimaryColumn("uuid")
	id: string;

	@ManyToOne(
		() => UserEntity,
		(user) => user.resources,
	)
	user: typeof UserEntity;

	@Column({ type: "text" })
	name: string;

	@Column({ type: "text", nullable: true })
	description: string | null;

	@Column({
		type: "enum",
		enum: ["Available", "Unavailable", "Currently Unavailable"],
	})
	availability: ResourceAvailabilityType;

	@Column({ type: "timestamp" })
	createdAt: Date;

	@RelationId((resource: ResourceEntity) => resource.user)
	userId: string;
}
