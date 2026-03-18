// Generated after a transaction — feeds into trust score calculation
import {
	Column,
	Entity,
	JoinColumn,
	ManyToOne,
	PrimaryGeneratedColumn,
	RelationId,
} from "typeorm";
import { TransactionEntity } from "./TransactionEntity";
import { UserEntity } from "./UserEntity";

@Entity({ name: "feedback" })
export class FeedbackEntity {
	@PrimaryGeneratedColumn("uuid")
	id: string;

	@ManyToOne(() => TransactionEntity, { onDelete: "CASCADE" })
	@JoinColumn({ name: "transactionId" })
	transaction: TransactionEntity;

	@RelationId((f: FeedbackEntity) => f.transaction)
	transactionId: string;

	@ManyToOne(() => UserEntity, { onDelete: "CASCADE" })
	@JoinColumn({ name: "reviewerId" })
	reviewer: UserEntity;

	@RelationId((f: FeedbackEntity) => f.reviewer)
	reviewerId: string;

	@ManyToOne(() => UserEntity, { onDelete: "CASCADE" })
	@JoinColumn({ name: "revieweeId" })
	reviewee: UserEntity;

	@RelationId((f: FeedbackEntity) => f.reviewee)
	revieweeId: string;

	// 1–5
	@Column({ type: "smallint" })
	rating: number;

	@Column({ type: "text", nullable: true })
	comment: string | null;

	@Column({ type: "timestamptz" })
	createdAt: Date;
}
