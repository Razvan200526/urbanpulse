import type { NotificationType } from "@shared/types";
import {
	Column,
	Entity,
	JoinColumn,
	ManyToOne,
	PrimaryGeneratedColumn,
	RelationId,
} from "typeorm";
import { UserEntity } from "./UserEntity";

@Entity({ name: "notification" })
export class NotificationEntity {
	@PrimaryGeneratedColumn("uuid")
	id: string;

	@ManyToOne(() => UserEntity, { onDelete: "CASCADE" })
	@JoinColumn({ name: "userId" })
	user: UserEntity;

	@RelationId((n: NotificationEntity) => n.user)
	userId: string;

	// e.g. "HERO_ALERT" | "PULSE_CONFIRMED" | "MESSAGE" | "TRANSACTION" | "FEEDBACK"
	@Column({
		type: "enum",
		enum: [
			"HERO_ALERT",
			"PULSE_CONFIRMED",
			"MESSAGE",
			"TRANSACTION",
			"FEEDBACK",
		],
	})
	type: NotificationType;

	// JSON stringified payload — flexible for different notification types
	@Column({ type: "jsonb" })
	payload: Record<string, unknown>;

	@Column({ type: "boolean", default: false })
	read: boolean;

	@Column({ type: "timestamptz" })
	createdAt: Date;
}
