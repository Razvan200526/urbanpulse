import type { ConversationSummary } from "../hooks";

export const getConversationTitle = (
	conversation: ConversationSummary,
	currentUserId: string | undefined,
) => {
	const otherMembers = conversation.members.filter(
		(member) => member.id !== currentUserId,
	);

	if (
		conversation.conversation.type === "PULSE" ||
		conversation.conversation.type === "GROUP"
	) {
		const fallback =
			conversation.conversation.type === "PULSE"
				? "Pulse team"
				: "Group conversation";
		return otherMembers.map((member) => member.name).join(", ") || fallback;
	}

	return otherMembers[0]?.name || "Direct conversation";
};

export const getConversationAvatarMember = (
	conversation: ConversationSummary,
	currentUserId: string | undefined,
) => {
	const otherMembers = conversation.members.filter(
		(member) => member.id !== currentUserId,
	);

	return otherMembers[0] ?? conversation.members[0] ?? null;
};

export const getConversationTypeLabel = (type: string) => {
	if (type === "PULSE") {
		return "Pulse coordination thread";
	}

	if (type === "GROUP") {
		return "Group conversation";
	}

	return "Direct conversation";
};

export const formatConversationTime = (value: string) => {
	const date = new Date(value);
	const today = new Date();
	const yesterday = new Date(today);
	yesterday.setDate(today.getDate() - 1);

	if (date.toDateString() === today.toDateString()) {
		return date.toLocaleTimeString([], {
			hour: "2-digit",
			minute: "2-digit",
		});
	}

	if (date.toDateString() === yesterday.toDateString()) {
		return "Yesterday";
	}

	return date.toLocaleDateString([], {
		month: "short",
		day: "numeric",
	});
};
