import { beforeEach, describe, expect, mock, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";

const messagesState = {
	auth: { user: { id: "user-1" } },
	conversations: [] as Array<any>,
	thread: null as any,
	isPending: false,
	isThreadPending: false,
	searchParams: new URLSearchParams(),
};

mock.module("@client/hooks/useAuth", () => ({
	useAuth: () => ({
		data: messagesState.auth,
	}),
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
	useSendConversationMessage: () => ({
		mutateAsync: async () => messagesState.thread,
		isPending: false,
	}),
}));

mock.module("react-router", () => ({
	useSearchParams: () => [
		messagesState.searchParams,
		(value: Record<string, string>) => {
			messagesState.searchParams = new URLSearchParams(value);
		},
	],
}));

mock.module("@client/components/Button/Button", () => ({
	Button: ({ children }: { children: React.ReactNode }) => (
		<button>{children}</button>
	),
}));

mock.module("@client/components/Header", () => ({
	Header: ({ title }: { title: string }) => <h1>{title}</h1>,
}));

mock.module("@client/components/PageLoader", () => ({
	PageLoader: () => <div>Page Loader</div>,
}));

mock.module("@client/components/user/Avatar", () => ({
	Avatar: ({ user }: { user?: { name?: string } | null }) => (
		<div>{user?.name || "Avatar"}</div>
	),
}));

mock.module("@heroui/react", () => ({
	ScrollShadow: ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	),
	Separator: () => <hr />,
	Toast: { toast: { danger: () => {}, success: () => {} } },
	cn: (...classes: Array<string | false | null | undefined>) =>
		classes.filter(Boolean).join(" "),
}));

const { MessagesPage } = await import("./MessagesPage");

describe("MessagesPage", () => {
	beforeEach(() => {
		messagesState.isPending = false;
		messagesState.isThreadPending = false;
		messagesState.searchParams = new URLSearchParams();
		messagesState.conversations = [];
		messagesState.thread = null;
	});

	test("renders a loader while conversations are loading", () => {
		messagesState.isPending = true;

		const markup = renderToStaticMarkup(<MessagesPage />);

		expect(markup).toContain("Page Loader");
	});

	test("renders the empty inbox state", () => {
		const markup = renderToStaticMarkup(<MessagesPage />);

		expect(markup).toContain("Coordination inbox");
		expect(markup).toContain("No conversations yet.");
	});

	test("renders the selected conversation thread", () => {
		messagesState.searchParams = new URLSearchParams({
			conversationId: "conversation-1",
		});
		messagesState.conversations = [
			{
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
			},
		];
		messagesState.thread = {
			...messagesState.conversations[0],
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

		expect(markup).toContain("Alex");
		expect(markup).toContain("See you there");
		expect(markup).toContain("Direct conversation");
		expect(markup).toContain("Send");
	});
});
