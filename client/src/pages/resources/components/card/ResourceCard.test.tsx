import { describe, expect, mock, test } from "bun:test";
import type { ResourceType } from "@server/db/schema";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { ResourceWithUsersType } from "../../resourceResponses";

mock.module("@client/components/Button/Button", () => ({
	Button: ({ children }: { children: React.ReactNode }) => (
		<button>{children}</button>
	),
}));

mock.module("@client/components/chips/AvaiabilityChip", () => ({
	AvailabilityChip: ({ status }: { status: string }) => <span>{status}</span>,
}));

mock.module("@client/components/typography", () => ({
	H6: ({ children }: { children: React.ReactNode }) => <h6>{children}</h6>,
}));

mock.module("@client/components/user/Avatar", () => ({
	Avatar: ({ user }: { user?: { name?: string | null } | null }) => (
		<span>{user?.name || "Avatar"}</span>
	),
}));

mock.module("@heroui/react", () => {
	const Card = ({ children }: { children: React.ReactNode }) => (
		<section>{children}</section>
	);
	Card.Header = ({ children }: { children: React.ReactNode }) => (
		<header>{children}</header>
	);
	Card.Content = ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	);
	Card.Footer = ({ children }: { children: React.ReactNode }) => (
		<footer>{children}</footer>
	);

	return {
		Card,
		Separator: () => <hr />,
	};
});

mock.module("./ResourceDetailsDrawer", () => ({
	ResourceDetailsDrawer: () => <div>Details drawer</div>,
}));

const { ResourceCard } = await import("./ResourceCard");

const buildItem = (
	overrides: Partial<ResourceWithUsersType> = {},
): ResourceWithUsersType => ({
	resource: {
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
	},
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
	reviewSummary: {
		averageRating: null,
		count: 0,
	},
	...overrides,
});

describe("ResourceCard", () => {
	test("renders an empty review state", () => {
		const markup = renderToStaticMarkup(<ResourceCard item={buildItem()} />);

		expect(markup).toContain("No reviews yet");
		expect(markup).not.toContain("120+ reviews");
	});

	test("renders the real review summary", () => {
		const markup = renderToStaticMarkup(
			<ResourceCard
				item={buildItem({
					reviewSummary: {
						averageRating: 4.5,
						count: 2,
					},
				})}
			/>,
		);

		expect(markup).toContain("4.5 (2 reviews)");
	});
});
