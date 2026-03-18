// Resource borrowing/lending — drives Trust Score + Reliability Logic (8 pts)
import { TransactionStatusEnum } from "@shared/types";
import {
	Column,
	Entity,
	JoinColumn,
	ManyToOne,
	PrimaryGeneratedColumn,
	RelationId,
} from "typeorm";
import { ResourceEntity } from "./ResourceEntity";
import { UserEntity } from "./UserEntity";

@Entity({ name: "transaction" })
export class TransactionEntity {
	@PrimaryGeneratedColumn("uuid")
	id: string;

	@ManyToOne(() => ResourceEntity, { onDelete: "CASCADE" })
	@JoinColumn({ name: "resourceId" })
	resource: ResourceEntity;

	@RelationId((t: TransactionEntity) => t.resource)
	resourceId: string;

	@ManyToOne(() => UserEntity, { onDelete: "SET NULL", nullable: true })
	@JoinColumn({ name: "borrowerId" })
	borrower: UserEntity;

	@RelationId((t: TransactionEntity) => t.borrower)
	borrowerId: string;

	@ManyToOne(() => UserEntity, { onDelete: "SET NULL", nullable: true })
	@JoinColumn({ name: "lenderId" })
	lender: UserEntity;

	@RelationId((t: TransactionEntity) => t.lender)
	lenderId: string;

	// e.g. "PENDING" | "ACTIVE" | "COMPLETED" | "CANCELLED"
	@Column({ type: "enum", enum: TransactionStatusEnum })
	status: TransactionStatusEnum;

	@Column({ type: "timestamptz" })
	startAt: Date;

	@Column({ type: "timestamptz", nullable: true })
	endAt: Date | null;
}
