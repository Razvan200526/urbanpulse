import { ConversationTypeEnum } from "@shared/types";
import {
	Column,
	Entity,
	JoinColumn,
	ManyToOne,
	OneToMany,
	PrimaryGeneratedColumn,
	RelationId,
} from "typeorm";
import { MessageEntity } from "./MessageEntity";
import { ConversationMemberEntity } from "./ConversationMemberEntity";
import { PulseEntity } from "./PulseEntity";

@Entity({ name: "conversation" })
export class ConversationEntity {
	@PrimaryGeneratedColumn("uuid")
	id: string;

	// "DIRECT" | "GROUP" | "PULSE"
	@Column({ type: "enum", enum: ConversationTypeEnum })
	type: ConversationTypeEnum;

	// nullable — only set when spawned from a Pulse
	@ManyToOne(() => PulseEntity, { onDelete: "SET NULL", nullable: true })
	@JoinColumn({ name: "pulseId" })
	pulse: PulseEntity | null;

	@RelationId((c: ConversationEntity) => c.pulse)
	pulseId: string | null;

	@OneToMany(
		() => MessageEntity,
		(m) => m.conversation,
	)
	messages: MessageEntity[];

	@OneToMany(
		() => ConversationMemberEntity,
		(cm) => cm.conversation,
	)
	members: ConversationMemberEntity[];

	@Column({ type: "timestamptz" })
	createdAt: Date;
}
