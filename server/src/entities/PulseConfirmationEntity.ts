import {
	Entity,
	JoinColumn,
	ManyToOne,
	PrimaryGeneratedColumn,
	RelationId,
	Column,
} from "typeorm";
import { UserEntity } from "./UserEntity";
import { PulseEntity } from "./PulseEntity";

@Entity({ name: "pulse_confirmation" })
export class PulseConfirmationEntity {
	@PrimaryGeneratedColumn("uuid")
	id: string;

	@ManyToOne(() => PulseEntity, { onDelete: "CASCADE" })
	@JoinColumn({ name: "pulseId" })
	pulse: PulseEntity;

	@RelationId((pc: PulseConfirmationEntity) => pc.pulse)
	pulseId: string;

	@ManyToOne(() => UserEntity, { onDelete: "CASCADE" })
	@JoinColumn({ name: "userId" })
	user: UserEntity;

	@RelationId((pc: PulseConfirmationEntity) => pc.user)
	userId: string;

	@Column({ type: "timestamptz" })
	confirmedAt: Date;
}
