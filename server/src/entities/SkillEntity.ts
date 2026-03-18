import { Column, Entity, ManyToOne, PrimaryColumn } from "typeorm";
import { UserEntity } from "./UserEntity";

@Entity({
	name: "skill",
})
export class SkillEntity {
	@PrimaryColumn("uuid")
	id: string;

	@Column({ type: "text" })
	tag: string;

	@ManyToOne(
		() => UserEntity,
		(user) => user.skills,
		{
			onDelete: "CASCADE",
		},
	)
	user: typeof UserEntity;
}
