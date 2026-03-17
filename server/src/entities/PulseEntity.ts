import {
	Column,
	Entity,
	Index,
	ManyToOne,
	PrimaryGeneratedColumn,
	type Point,
} from "typeorm";
import { PulseEnum, UrgencyEnum } from "@shared/types/index";
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
	)
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
	@Column({ type: "geography", spatialFeatureType: "Point" })
	position: Point;

	@Column({ type: "boolean" })
	isResolved: boolean;

	@Column({ type: "boolean", nullable: true })
	isVerified: boolean;

	@Column({ type: "timestamp" })
	createdAt: Date;
}
