// Advanced Bonus — AI Guardian for Lost Pets
import {
	Column,
	Entity,
	JoinColumn,
	OneToMany,
	OneToOne,
	PrimaryGeneratedColumn,
	RelationId,
} from "typeorm";
import { PetMatchEntity } from "./PetMatchEntity";
import { PulseEntity } from "./PulseEntity";

@Entity({ name: "pet_alert" })
export class PetAlertEntity {
	@PrimaryGeneratedColumn("uuid")
	id: string;

	@OneToOne(() => PulseEntity, { onDelete: "CASCADE" })
	@JoinColumn({ name: "pulseId" })
	pulse: PulseEntity;

	@RelationId((pa: PetAlertEntity) => pa.pulse)
	pulseId: string;

	@Column({ type: "text" })
	petType: string;

	@Column({ type: "text" })
	color: string;

	@Column({ type: "text", nullable: true })
	breed: string | null;

	@Column({ type: "text", nullable: true })
	imageUrl: string | null;

	// AI-generated descriptor for similarity matching
	@Column({ type: "text", nullable: true })
	aiDescriptor: string | null;

	@OneToMany(
		() => PetMatchEntity,
		(pm) => pm.lostAlert,
	)
	lostMatches: PetMatchEntity[];

	@OneToMany(
		() => PetMatchEntity,
		(pm) => pm.foundAlert,
	)
	foundMatches: PetMatchEntity[];
}
