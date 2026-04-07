import { beforeEach, describe, expect, mock, test } from "bun:test";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";

const buttonProps: Array<Record<string, any>> = [];
const toastDangerCalls: string[] = [];
const submitCalls: Array<Record<string, unknown>> = [];

mock.module("@client/components/Button/Button", () => ({
	Button: (props: Record<string, any>) => {
		buttonProps.push(props);
		return <button>{props.children}</button>;
	},
}));

mock.module("@client/components/Modal", () => ({
	Modal: ({
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

mock.module("@client/components/TextArea", () => ({
	TextArea: React.forwardRef(
		(
			_props: unknown,
			ref: React.Ref<{
				getValue: () => string;
				setValue: (value: string) => void;
			}>,
		) => {
			if (ref && typeof ref === "object") {
				ref.current = {
					getValue: () => "Helpful handoff",
					setValue: () => {},
				};
			}
			return <div>Comment field</div>;
		},
	),
}));

mock.module("@client/components/typography", () => ({
	H3: ({ children }: { children: React.ReactNode }) => <h3>{children}</h3>,
	H6: ({ children }: { children: React.ReactNode }) => <h6>{children}</h6>,
}));

mock.module("@client/hooks/useAuth", () => ({
	useAuth: () => ({ data: { user: { id: "borrower-1" } } }),
}));

mock.module("@heroui/react", () => ({
	Chip: ({ children }: { children: React.ReactNode }) => (
		<span>{children}</span>
	),
	Drawer: {
		Footer: ({ children }: { children: React.ReactNode }) => (
			<footer>{children}</footer>
		),
	},
	Toast: {
		toast: {
			danger: (message: string) => {
				toastDangerCalls.push(message);
			},
		},
	},
}));

mock.module("../hooks", () => ({
	useSubmitResourceReview: () => ({
		mutateAsync: async (payload: Record<string, unknown>) => {
			submitCalls.push(payload);
		},
		isPending: false,
	}),
}));

const { ResourceReviewModal } = await import("./ResourceReviewModal");

const resetState = () => {
	buttonProps.length = 0;
	toastDangerCalls.length = 0;
	submitCalls.length = 0;
};

describe("ResourceReviewModal", () => {
	beforeEach(resetState);

	test("renders a basic rating and comment form", () => {
		const markup = renderToStaticMarkup(
			<ResourceReviewModal
				modalRef={{ current: null }}
				transactionId="transaction-1"
				resourceId="resource-1"
			/>,
		);

		expect(markup).toContain("Review Resource");
		expect(markup).toContain("Rate your borrowing experience");
		expect(markup).toContain("Comment field");
		expect(markup).toContain("Submit review");
	});

	test("requires a star rating before submitting", async () => {
		renderToStaticMarkup(
			<ResourceReviewModal
				modalRef={{ current: null }}
				transactionId="transaction-1"
				resourceId="resource-1"
			/>,
		);

		await buttonProps
			.find((props) => props.children === "Submit review")
			?.onPress?.();

		expect(toastDangerCalls).toEqual(["Choose a rating before submitting."]);
		expect(submitCalls).toEqual([]);
	});
});
