import { beforeEach, describe, expect, mock, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";

const messagesState = {
	auth: { user: { id: "user-1" } },
	isMobile: false,
	routeConversationId: null as string | null,
	conversations: [] as Array<any>,
	thread: null as any,
	isPending: false,
	isThreadPending: false,
	typingUserIds: [] as string[],
	navigateCalls: [] as string[],
};

const buttonProps: Array<Record<string, any>> = [];

const directConversation = {
	conversation: {
		id: "conversation-1",
		type: "DIRECT",
		pulseId: null,
		createdAt: "2026-04-04T10:00:00.000Z",
	},
	members: [
		{
			id: "user-1",
			name: "Owner",
			email: "owner@example.com",
			image: null,
		},
		{
			id: "user-2",
			name: "Alex",
			email: "alex@example.com",
			image: null,
		},
	],
	lastMessage: {
		id: "message-1",
		content: "See you there",
		senderId: "user-2",
		sentAt: "2026-04-04T10:00:00.000Z",
	},
};

mock.module("@client/hooks/useAuth", () => ({
	useAuth: () => ({
		data: messagesState.auth,
	}),
}));

mock.module("@client/hooks/useMediaQuery", () => ({
	useIsMobile: () => messagesState.isMobile,
}));

mock.module("./hooks", () => ({
	useConversationList: () => ({
		data: messagesState.conversations,
		isPending: messagesState.isPending,
	}),
	useConversationThread: () => ({
		data: messagesState.thread,
		isPending: messagesState.isThreadPending,
	}),
	useMessageSocketEvents: () => ({
		typingUserIds: messagesState.typingUserIds,
	}),
	useSendConversationMessage: () => ({
		mutateAsync: async () => messagesState.thread,
		isPending: false,
	}),
	sendConversationTypingState: () => {},
}));

mock.module("react-router", () => ({
	useNavigate: () => (path: string) => {
		messagesState.navigateCalls.push(path);
		if (path === "/messages") {
			messagesState.routeConversationId = null;
			return;
		}

		const match = path.match(/^\/messages\/(.+)$/);
		messagesState.routeConversationId = match?.[1] ?? null;
	},
	useParams: () => ({
		conversationId: messagesState.routeConversationId ?? undefined,
	}),
}));

mock.module("@client/components/Button/Button", () => ({
	Button: (props: Record<string, any>) => {
		buttonProps.push(props);
		return <button>{props.children}</button>;
	},
}));

mock.module("@client/components/Header", () => ({
	Header: ({ title }: { title: string }) => <h1>{title}</h1>,
}));

mock.module("@client/components/PageLoader", () => ({
	PageLoader: () => <div>Page Loader</div>,
}));

mock.module("@client/components/input/InputMessage", () => ({
	InputMessage: () => <button>Send</button>,
}));

mock.module("@client/components/user/Avatar", () => ({
	Avatar: ({ user }: { user?: { name?: string } | null }) => (
		<div>{user?.name || "Avatar"}</div>
	),
}));

mock.module("@heroui/react", () => ({
	cn: (...classes: Array<string | false | null | undefined>) =>
		classes.filter(Boolean).join(" "),
	Card: Object.assign(
		({ children }: { children: React.ReactNode }) => <div>{children}</div>,
		{
			Content: ({ children }: { children: React.ReactNode }) => (
				<div>{children}</div>
			),
		},
	),
	ScrollShadow: ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	),
	Separator: () => <hr />,
	Toast: { toast: { danger: () => {}, success: () => {} } },
}));

const { MessagesPage } = await import("./MessagesPage");

describe("MessagesPage", () => {
	beforeEach(() => {
		messagesState.isMobile = false;
		messagesState.routeConversationId = null;
		messagesState.isPending = false;
		messagesState.isThreadPending = false;
		messagesState.conversations = [];
		messagesState.thread = null;
		messagesState.typingUserIds = [];
		messagesState.navigateCalls = [];
		buttonProps.length = 0;
	});

	test("renders a loader while conversations are loading", () => {
		messagesState.isPending = true;

		const markup = renderToStaticMarkup(<MessagesPage />);

		expect(markup).toContain("Page Loader");
	});

	test("renders the empty inbox state on mobile without a thread pane", () => {
		messagesState.isMobile = true;

		const markup = renderToStaticMarkup(<MessagesPage />);

		expect(markup).toContain("Your messages");
		expect(markup).toContain("It&#x27;s empty here.");
		expect(markup).not.toContain(
			"Select a conversation to start coordinating.",
		);
	});

	test("renders the desktop list and empty prompt before first conversation navigation effect", () => {
		messagesState.conversations = [directConversation];
		messagesState.thread = {
			...directConversation,
			messages: [
				{
					id: "message-1",
					content: "See you there",
					senderId: "user-2",
					sentAt: "2026-04-04T10:00:00.000Z",
					sender: {
						id: "user-2",
						name: "Alex",
						email: "alex@example.com",
						image: null,
					},
				},
			],
		};

		const markup = renderToStaticMarkup(<MessagesPage />);

		expect(markup).toContain("Your messages");
		expect(markup).toContain("Alex");
		expect(markup).toContain("See you there");
		expect(markup).toContain("Select a conversation to start coordinating.");
		expect(markup).not.toContain("Send");
	});

	test("renders the selected conversation route as a full-screen mobile thread", () => {
		messagesState.isMobile = true;
		messagesState.routeConversationId = "conversation-1";
		messagesState.conversations = [directConversation];
		messagesState.thread = {
			...directConversation,
			messages: [
				{
					id: "message-1",
					content: "See you there",
					senderId: "user-2",
					sentAt: "2026-04-04T10:00:00.000Z",
					sender: {
						id: "user-2",
						name: "Alex",
						email: "alex@example.com",
						image: null,
					},
				},
			],
		};

		const markup = renderToStaticMarkup(<MessagesPage />);

		expect(buttonProps.some((props) => props.isIconOnly)).toBe(true);
		expect(markup).toContain("Alex");
		expect(markup).toContain("See you there");
		expect(markup).not.toContain("Your messages");
	});

	test("renders the route-selected thread in desktop split view", () => {
		messagesState.routeConversationId = "conversation-1";
		messagesState.conversations = [directConversation];
		messagesState.thread = {
			...directConversation,
			messages: [
				{
					id: "message-1",
					content: "See you there",
					senderId: "user-2",
					sentAt: "2026-04-04T10:00:00.000Z",
					sender: {
						id: "user-2",
						name: "Alex",
						email: "alex@example.com",
						image: null,
					},
				},
			],
		};

		const markup = renderToStaticMarkup(<MessagesPage />);

		expect(markup).toContain("Your messages");
		expect(markup).toContain("Alex");
		expect(markup).toContain("See you there");
		expect(markup).toContain("Direct conversation");
		expect(markup).not.toContain("Back");
	});

	test("returns to /messages when backing out on mobile", async () => {
		messagesState.isMobile = true;
		messagesState.routeConversationId = "conversation-1";
		messagesState.conversations = [directConversation];
		messagesState.thread = {
			...directConversation,
			messages: [],
		};

		renderToStaticMarkup(<MessagesPage />);

		await buttonProps.find((props) => props.isIconOnly)?.onPress?.();

		expect(messagesState.navigateCalls).toContain("/messages");
		expect(messagesState.routeConversationId).toBeNull();
	});

	test("renders typing state and read receipts in the active thread", () => {
		messagesState.routeConversationId = "conversation-1";
		messagesState.conversations = [directConversation];
		messagesState.typingUserIds = ["user-2"];
		messagesState.thread = {
			...directConversation,
			messages: [
				{
					id: "message-1",
					content: "See you there",
					senderId: "user-1",
					sentAt: "2026-04-04T10:00:00.000Z",
					deliveryStatus: "read",
					sender: {
						id: "user-1",
						name: "Owner",
						email: "owner@example.com",
						image: null,
					},
				},
			],
		};

		const markup = renderToStaticMarkup(<MessagesPage />);

		expect(markup).toContain("Alex is typing...");
		expect(markup).toContain('aria-label="Read"');
	});
});
