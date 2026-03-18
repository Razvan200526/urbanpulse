// A user responding to a Pulse (Smart Request Matching — Hero Alert)
import { ResponseStatusEnum } from "@shared/types";
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

@Entity({ name: "response" })
export class ResponseEntity {
	@PrimaryGeneratedColumn("uuid")
	id: string;

	@ManyToOne(() => PulseEntity, { onDelete: "CASCADE" })
	@JoinColumn({ name: "pulseId" })
	pulse: PulseEntity;

	@RelationId((r: ResponseEntity) => r.pulse)
	pulseId: string;

	@ManyToOne(() => UserEntity, { onDelete: "CASCADE" })
	@JoinColumn({ name: "responderId" })
	responder: UserEntity;

	@RelationId((r: ResponseEntity) => r.responder)
	responderId: string;

	// e.g. "PENDING" | "ACCEPTED" | "DECLINED" | "COMPLETED"
	@Column({ type: "enum", enum: ResponseStatusEnum })
	status: ResponseStatusEnum;

	@Column({ type: "timestamptz" })
	createdAt: Date;
}
