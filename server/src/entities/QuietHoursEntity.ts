import {
	Column,
	Entity,
	JoinColumn,
	ManyToOne,
	PrimaryGeneratedColumn,
	RelationId,
} from "typeorm";
import { UserEntity } from "./UserEntity";

@Entity({ name: "quiet_hours" })
export class QuietHoursEntity {
	@PrimaryGeneratedColumn("uuid")
	id: string;

	@ManyToOne(() => UserEntity, { onDelete: "CASCADE" })
	@JoinColumn({ name: "userId" })
	user: typeof UserEntity;

	@RelationId((qh: QuietHoursEntity) => qh.user)
	userId: string;

	// "HH:MM" format e.g. "22:00"
	@Column({ type: "time" })
	startTime: string;

	@Column({ type: "time" })
	endTime: string;

	// e.g. "MON,TUE,WED" or "ALL"
	@Column({ type: "text" })
	days: string;
}
