import {
	Column,
	Entity,
	JoinColumn,
	ManyToOne,
	PrimaryGeneratedColumn,
	RelationId,
} from "typeorm";
import { PetAlertEntity } from "./PetAlertEntity";

@Entity({ name: "pet_match" })
export class PetMatchEntity {
	@PrimaryGeneratedColumn("uuid")
	id: string;

	@ManyToOne(
		() => PetAlertEntity,
		(pa) => pa.lostMatches,
		{ onDelete: "CASCADE" },
	)
	@JoinColumn({ name: "lostAlertId" })
	lostAlert: typeof PetAlertEntity;

	@RelationId((pm: PetMatchEntity) => pm.lostAlert)
	lostAlertId: string;

	@ManyToOne(
		() => PetAlertEntity,
		(pa) => pa.foundMatches,
		{ onDelete: "CASCADE" },
	)
	@JoinColumn({ name: "foundAlertId" })
	foundAlert: typeof PetAlertEntity;

	@RelationId((pm: PetMatchEntity) => pm.foundAlert)
	foundAlertId: string;

	// 0.0 – 1.0, produced by the AI similarity model
	@Column({ type: "float" })
	confidenceScore: number;

	@Column({ type: "timestamptz" })
	createdAt: Date;
}
