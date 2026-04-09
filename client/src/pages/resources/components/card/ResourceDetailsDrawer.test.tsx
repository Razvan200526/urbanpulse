import { beforeEach, describe, expect, mock, test } from "bun:test";
import type { ResourceType, TransactionType } from "@server/db/schema";
import { TransactionStatusEnum } from "@shared/types";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { ResourceWithUsersType } from "../../resourceResponses";

const authState = {
	userId: "owner-1",
};

const hookState = {
	pendingRequests: [] as Array<{
		transaction: TransactionType;
		resource: ResourceType | null;
		borrower: any;
	}>,
	myTransaction: null as TransactionType | null,
	isTransactionLoading: false,
};

const buttonProps: Array<Record<string, any>> = [];
const respondCalls: Array<Record<string, unknown>> = [];
const completeCalls: Array<Record<string, unknown>> = [];
const reviewOpenCalls: string[] = [];

mock.module("@client/components/AppDrawer", () => ({
	AppDrawer: ({
		header,
		footer,
		children,
	}: {
		header: React.ReactNode;
		footer: React.ReactNode;
		children: React.ReactNode;
	}) => (
		<div>
			{header}
			{children}
			{footer}
		</div>
	),
}));

mock.module("@client/components/Button/Button", () => ({
	Button: (props: Record<string, any>) => {
		buttonProps.push(props);
		return <button>{props.children}</button>;
	},
}));

mock.module("@client/components/chips/AvaiabilityChip", () => ({
	AvailabilityChip: ({ status }: { status: string }) => <span>{status}</span>,
}));

mock.module("@client/components/user/Avatar", () => ({
	Avatar: ({ user }: { user?: { name?: string | null } | null }) => (
		<span>{user?.name || "Avatar"}</span>
	),
}));

mock.module("@client/hooks/useAuth", () => ({
	useAuth: () => ({
		data: authState.userId ? { user: { id: authState.userId } } : null,
	}),
}));

mock.module("@client/pages/map/components/MetaRow", () => ({
	MetaRow: ({
		label,
		children,
	}: {
		label: string;
		children: React.ReactNode;
	}) => (
		<div>
			<span>{label}</span>
			{children}
		</div>
	),
}));

mock.module("@heroui/react", () => {
	const Chip = ({ children }: { children: React.ReactNode }) => (
		<span>{children}</span>
	);
	const Drawer = {
		Footer: ({ children }: { children: React.ReactNode }) => (
			<footer>{children}</footer>
		),
	};

	return { Chip, Drawer };
});

mock.module("../../hooks", () => ({
	useRequestBorrow: () => ({ mutate: () => {}, isPending: false }),
	useGetPendingRequests: () => ({ data: hookState.pendingRequests }),
	useRespondToRequest: () => ({
		mutateAsync: async (payload: Record<string, unknown>) => {
			respondCalls.push(payload);
		},
		isPending: false,
	}),
	useGetResourceTransaction: () => ({
		data: hookState.myTransaction,
		isLoading: hookState.isTransactionLoading,
	}),
	useCompleteResourceTransaction: () => ({
		mutateAsync: async (payload: Record<string, unknown>) => {
			completeCalls.push(payload);
			return { id: payload.transactionId };
		},
		isPending: false,
	}),
}));

mock.module("../ResourceReviewModal", () => ({
	ResourceReviewModal: ({
		modalRef,
	}: {
		modalRef: React.RefObject<{ open: () => void } | null>;
	}) => {
		if (modalRef) {
			(modalRef as { current: { open: () => void } | null }).current = {
				open: () => {
					reviewOpenCalls.push("open");
				},
			};
		}
		return <div>Review modal</div>;
	},
}));

const { ResourceDetailsDrawer } = await import("./ResourceDetailsDrawer");

const resource: ResourceType = {
	id: "resource-1",
	userId: "owner-1",
	name: "Ladder",
	description: "Tall ladder",
	availability: "Available",
	position: { x: 26.1, y: 44.4 } as ResourceType["position"],
	locationLabel: "Bucharest",
	resourceType: "Item",
	imageUrls: [],
	createdAt: new Date("2025-01-01T00:00:00.000Z"),
};

const borrower = {
	id: "borrower-1",
	name: "Borrower",
	image: null,
};

const pendingTransaction: TransactionType = {
	id: "transaction-1",
	resourceId: resource.id,
	borrowerId: borrower.id,
	lenderId: resource.userId,
	status: TransactionStatusEnum.Pending,
	startAt: new Date("2025-01-01T00:00:00.000Z"),
	endAt: null,
};

const item: ResourceWithUsersType = {
	resource,
	author: {
		id: "owner-1",
		name: "Owner",
		email: "owner@example.com",
		emailVerified: true,
		image: null,
		createdAt: "2025-01-01T00:00:00.000Z",
		updatedAt: "2025-01-01T00:00:00.000Z",
		role: "user",
		bio: null,
		trustScore: 80,
		successfulInteractions: 1,
		isVerified: false,
		rememberMe: false,
	},
	recentUsers: [],
	reviewSummary: { averageRating: null, count: 0 },
};

const resetState = () => {
	authState.userId = "owner-1";
	hookState.pendingRequests = [];
	hookState.myTransaction = null;
	hookState.isTransactionLoading = false;
	buttonProps.length = 0;
	respondCalls.length = 0;
	completeCalls.length = 0;
	reviewOpenCalls.length = 0;
};

describe("ResourceDetailsDrawer", () => {
	beforeEach(resetState);

	test("shows owner pending requests and wires acceptance", async () => {
		hookState.pendingRequests = [
			{
				transaction: pendingTransaction,
				resource,
				borrower,
			},
		];

		const markup = renderToStaticMarkup(
			<ResourceDetailsDrawer
				item={item}
				author={item.author || undefined}
				isOpen
				onOpenChange={() => {}}
			/>,
		);

		expect(markup).toContain("Pending requests");
		expect(markup).toContain("Borrower");

		await buttonProps.find((props) => props.children === "Accept")?.onPress?.();

		expect(respondCalls).toEqual([
			{
				transactionId: pendingTransaction.id,
				accept: true,
			},
		]);
	});

	test("shows mark as done for an active borrower transaction and opens review", async () => {
		authState.userId = "borrower-1";
		hookState.myTransaction = {
			...pendingTransaction,
			status: TransactionStatusEnum.Active,
		};

		const markup = renderToStaticMarkup(
			<ResourceDetailsDrawer
				item={item}
				author={item.author || undefined}
				isOpen
				onOpenChange={() => {}}
			/>,
		);

		expect(markup).toContain("Mark as done");

		await buttonProps
			.find((props) => props.children === "Mark as done")
			?.onPress?.();

		expect(completeCalls).toEqual([
			{
				transactionId: pendingTransaction.id,
				resourceId: resource.id,
			},
		]);
		expect(reviewOpenCalls).toEqual(["open"]);
	});

	test("disables duplicate borrow requests while pending", () => {
		authState.userId = "borrower-1";
		hookState.myTransaction = pendingTransaction;

		const markup = renderToStaticMarkup(
			<ResourceDetailsDrawer
				item={item}
				author={item.author || undefined}
				isOpen
				onOpenChange={() => {}}
			/>,
		);

		expect(markup).toContain("Request pending");
	});
});
