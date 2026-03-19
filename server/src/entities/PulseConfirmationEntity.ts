import {
	Column,
	Entity,
	JoinColumn,
	ManyToOne,
	PrimaryGeneratedColumn,
	RelationId,
} from "typeorm";
import { PulseEntity } from "./PulseEntity";
import { UserEntity } from "./UserEntity";

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
