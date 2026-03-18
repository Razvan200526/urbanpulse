import {
	Column,
	Entity,
	JoinColumn,
	ManyToOne,
	PrimaryGeneratedColumn,
	RelationId,
} from "typeorm";
import { ConversationEntity } from "./ConversationEntity";
import { UserEntity } from "./UserEntity";

@Entity({ name: "message" })
export class MessageEntity {
	@PrimaryGeneratedColumn("uuid")
	id: string;

	@ManyToOne(() => ConversationEntity, { onDelete: "CASCADE" })
	@JoinColumn({ name: "conversationId" })
	conversation: typeof ConversationEntity;

	@RelationId((m: MessageEntity) => m.conversation)
	conversationId: string;

	@ManyToOne(() => UserEntity, { onDelete: "CASCADE" })
	@JoinColumn({ name: "senderId" })
	sender: UserEntity;

	@RelationId((m: MessageEntity) => m.sender)
	senderId: string;

	@Column({ type: "text" })
	content: string;

	@Column({ type: "timestamptz" })
	sentAt: Date;
}
