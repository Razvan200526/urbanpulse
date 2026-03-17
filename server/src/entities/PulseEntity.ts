import { PulseEnum, UrgencyEnum } from "@shared/types/index";
import {
	Column,
	Entity,
	type Geometry,
	Index,
	JoinColumn,
	ManyToOne,
	PrimaryGeneratedColumn,
	RelationId,
} from "typeorm";
import { UserEntity } from "./UserEntity";
@Entity({
	name: "pulse",
})
export class PulseEntity {
	@PrimaryGeneratedColumn("uuid")
	id: string;

	@Column({
		type: "enum",
		enum: PulseEnum,
		default: PulseEnum.Emergency,
	})
	type: PulseEnum;

	@ManyToOne(
		() => UserEntity,
		(user) => user.pulses,
		{
			onDelete: "CASCADE",
		},
	)

	@JoinColumn({ name: "userId" })
	user: typeof UserEntity;

	@RelationId((pulse: PulseEntity) => pulse.user)
	userId: string;

	@Column({
		type: "enum",
		enum: UrgencyEnum,
		default: UrgencyEnum.Unknown,
	})
	urgency: PulseEnum;

	@Column({ type: "varchar", length: 30 })
	title: string;

	@Column({ type: "text", nullable: true })
	description: string;

	@Index({ spatial: true })
	@Column({ type: "point", spatialFeatureType: "Point", srid: 4326 })
	position: Geometry;

	@Column({ type: "boolean" })
	isResolved: boolean;

	@Column({ type: "boolean", nullable: true })
	isVerified: boolean;

	@Column({ type: "timestamp" })
	createdAt: Date;
}
