import {
	Entity,
	JoinColumn,
	ManyToOne,
	PrimaryGeneratedColumn,
	RelationId,
} from "typeorm";
import { ConversationEntity } from "./ConversationEntity";
import { UserEntity } from "./UserEntity";

@Entity({ name: "conversation_member" })
export class ConversationMemberEntity {
	@PrimaryGeneratedColumn("uuid")
	id: string;

	@ManyToOne(() => ConversationEntity, { onDelete: "CASCADE" })
	@JoinColumn({ name: "conversationId" })
	conversation: typeof ConversationEntity;

	@RelationId((cm: ConversationMemberEntity) => cm.conversation)
	conversationId: string;

	@ManyToOne(() => UserEntity, { onDelete: "CASCADE" })
	@JoinColumn({ name: "userId" })
	user: UserEntity;

	@RelationId((cm: ConversationMemberEntity) => cm.user)
	userId: string;
}
