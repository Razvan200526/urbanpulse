import { beforeEach, describe, expect, mock, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";

const messagesState = {
	user: { user: { id: "user-1" } },
	requests: [] as Array<any>,
	isLoading: false,
};

mock.module("@client/hooks/useAuth", () => ({
	useAuth: () => ({
		data: messagesState.user,
	}),
}));

mock.module("../resources/hooks", () => ({
	useGetPendingRequests: () => ({
		data: messagesState.requests,
		isLoading: messagesState.isLoading,
	}),
}));

mock.module("../../components/Button/Button", () => ({
	Button: ({ children }: { children: React.ReactNode }) => (
		<button>{children}</button>
	),
}));

mock.module("../../components/typography", () => ({
	H3: ({ children }: { children: React.ReactNode }) => <h3>{children}</h3>,
}));

mock.module("../../components/user/Avatar", () => ({
	Avatar: ({ user }: { user: { name?: string } | null }) => (
		<div>{user?.name || "Avatar"}</div>
	),
}));

mock.module("@heroui/react", () => {
	const Card = ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	);
	Card.Content = ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	);
	const Table = ({ children }: { children: React.ReactNode }) => (
		<table>{children}</table>
	);
	Table.ScrollContainer = ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	);
	Table.Content = ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	);
	Table.Header = ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	);
	Table.Body = ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	);
	Table.Column = ({ children }: { children: React.ReactNode }) => (
		<span>{children}</span>
	);
	Table.Row = ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	);
	Table.Cell = ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	);

	return {
		Card,
		ScrollShadow: ({ children }: { children: React.ReactNode }) => (
			<div>{children}</div>
		),
		Spinner: () => <div>Spinner</div>,
		Table,
	};
});

mock.module("./components/RespondRequestModal", () => ({
	RespondRequestModal: ({
		transactionId,
		action,
	}: {
		transactionId: string | null;
		action: string | null;
	}) => (
		<div>
			Respond Modal:{transactionId ?? "none"}:{action ?? "none"}
		</div>
	),
}));

const { MessagesPage } = await import("./MessagesPage");

describe("MessagesPage", () => {
	beforeEach(() => {
		messagesState.user = { user: { id: "user-1" } };
		messagesState.requests = [];
		messagesState.isLoading = false;
	});

	test("renders a loader while pending requests are loading", () => {
		messagesState.isLoading = true;

		const markup = renderToStaticMarkup(<MessagesPage />);

		expect(markup).toContain("Pending Borrow Requests");
		expect(markup).toContain("Spinner");
	});

	test("renders an empty state when there are no requests", () => {
		const markup = renderToStaticMarkup(<MessagesPage />);

		expect(markup).toContain("No pending borrow requests right now.");
		expect(markup).toContain("Respond Modal:none:none");
	});

	test("renders pending request rows with fallback labels", () => {
		messagesState.requests = [
			{
				transaction: {
					id: "transaction-1",
					startAt: "2026-03-31T10:00:00.000Z",
				},
				resource: {
					name: "Generator",
				},
				borrower: {
					name: "Alex",
				},
			},
			{
				transaction: {
					id: "transaction-2",
					startAt: "2026-03-31T12:00:00.000Z",
				},
				resource: null,
				borrower: null,
			},
		];

		const markup = renderToStaticMarkup(<MessagesPage />);

		expect(markup).toContain("Generator");
		expect(markup).toContain("Alex");
		expect(markup).toContain("Unknown Resource");
		expect(markup).toContain("Unknown");
		expect(markup).toContain("Accept");
		expect(markup).toContain("Reject");
	});
});
