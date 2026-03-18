// Admin Dashboard — flagged content review (6 pts)
import { ReportStatusEnum } from "@shared/types";
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

@Entity({ name: "report" })
export class ReportEntity {
	@PrimaryGeneratedColumn("uuid")
	id: string;

	@ManyToOne(() => UserEntity, { onDelete: "CASCADE" })
	@JoinColumn({ name: "reporterId" })
	reporter: UserEntity;

	@RelationId((r: ReportEntity) => r.reporter)
	reporterId: string;

	// Either a user or a pulse is targeted — both nullable
	@ManyToOne(() => UserEntity, { onDelete: "CASCADE", nullable: true })
	@JoinColumn({ name: "targetUserId" })
	targetUser: UserEntity | null;

	@RelationId((r: ReportEntity) => r.targetUser)
	targetUserId: string | null;

	@ManyToOne(() => PulseEntity, { onDelete: "CASCADE", nullable: true })
	@JoinColumn({ name: "targetPulseId" })
	targetPulse: PulseEntity | null;

	@RelationId((r: ReportEntity) => r.targetPulse)
	targetPulseId: string | null;

	@Column({ type: "text" })
	reason: string;

	// "PENDING" | "RESOLVED" | "DISMISSED"
	@Column({
		type: "enum",
		enum: ReportStatusEnum,
		default: ReportStatusEnum.Pending,
	})
	status: ReportStatusEnum;

	@Column({ type: "timestamptz" })
	createdAt: Date;
}
