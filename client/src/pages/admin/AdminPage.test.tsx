import { beforeEach, describe, expect, mock, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";

const adminState = {
	isPending: false,
	error: null as Error | null,
	data: {
		counts: {
			users: 10,
			pulses: 5,
			resources: 7,
			reports: 2,
			transactions: 3,
			notifications: 9,
		},
		recentReports: [
			{
				id: "report-1",
				reason: "Spam pulse",
				status: "PENDING",
				createdAt: "2026-03-31T09:00:00.000Z",
			},
		],
		recentPulses: [
			{
				id: "pulse-1",
				title: "Need water",
				type: "Emergency",
				status: "ACTIVE",
				createdAt: "2026-03-31T09:00:00.000Z",
			},
		],
		recentResources: [
			{
				id: "resource-1",
				name: "Toolbox",
				availability: "Available",
				createdAt: "2026-03-31T09:00:00.000Z",
			},
		],
	},
	reports: [
		{
			id: "report-queue-1",
			reason: "Misleading location",
			status: "PENDING",
			createdAt: "2026-03-31T08:00:00.000Z",
			reporter: {
				id: "user-1",
				name: "Mara",
				email: "mara@example.com",
				role: "user",
			},
			targetUser: {
				id: "user-2",
				name: "Ionut",
				email: "ionut@example.com",
				role: "user",
			},
			targetPulse: {
				id: "pulse-2",
				title: "Road blocked",
				status: "ACTIVE",
				type: "Emergency",
				isVerified: true,
			},
		},
		{
			id: "report-queue-2",
			reason: "Handled already",
			status: "DISMISSED",
			createdAt: "2026-03-30T08:00:00.000Z",
			reporter: null,
			targetUser: null,
			targetPulse: null,
		},
	],
};

const buttonProps: Array<Record<string, any>> = [];
const mutateCalls: Array<unknown> = [];
const toastSuccessCalls: string[] = [];
const toastDangerCalls: string[] = [];

const labelOf = (children: React.ReactNode): string =>
	Array.isArray(children)
		? children.map((entry) => (typeof entry === "string" ? entry : "")).join("")
		: typeof children === "string"
			? children
			: "";

mock.module("@client/hooks/useAdminOverview", () => ({
	useAdminOverview: () => ({
		data: adminState.data,
		isPending: adminState.isPending,
		error: adminState.error,
	}),
}));

mock.module("@client/hooks/useModeration", () => ({
	useAdminReports: () => ({
		data: adminState.reports,
	}),
	useAdminDuplicatePulses: () => ({
		data: [],
	}),
	useAdminUsers: () => ({
		data: [],
	}),
	useAdminUserSessions: () => ({
		data: [],
	}),
	useReviewReport: () => ({
		isPending: false,
		mutate: (payload: unknown, options?: { onSuccess?: () => void }) => {
			mutateCalls.push(payload);
			options?.onSuccess?.();
		},
	}),
	useModeratePulse: () => ({
		isPending: false,
		mutate: () => {},
	}),
	useMergePulse: () => ({
		isPending: false,
		mutate: () => {},
	}),
	useAdminSetRole: () => ({
		isPending: false,
		mutate: () => {},
	}),
	useAdminBanUser: () => ({
		isPending: false,
		mutate: () => {},
	}),
	useAdminUnbanUser: () => ({
		isPending: false,
		mutate: () => {},
	}),
	useAdminRevokeUserSession: () => ({
		isPending: false,
		mutate: () => {},
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

mock.module("@heroui/react", () => {
	const Card = ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	);
	Card.Header = ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	);
	Card.Content = ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	);
	Card.Title = ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	);
	Card.Description = ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	);
	const Toast = {
		toast: {
			success: (message: string) => {
				toastSuccessCalls.push(message);
			},
			danger: (message: string) => {
				toastDangerCalls.push(message);
			},
		},
	};

	return {
		Card,
		ScrollShadow: ({ children }: { children: React.ReactNode }) => (
			<div>{children}</div>
		),
		Separator: () => <hr />,
		Toast,
		cn: (...classes: Array<string | false | null | undefined>) =>
			classes.filter(Boolean).join(" "),
	};
});

const { AdminPage } = await import("./AdminPage");

describe("AdminPage", () => {
	beforeEach(() => {
		adminState.isPending = false;
		adminState.error = null;
		buttonProps.length = 0;
		mutateCalls.length = 0;
		toastSuccessCalls.length = 0;
		toastDangerCalls.length = 0;
	});

	test("renders a loader while the overview is loading", () => {
		adminState.isPending = true;

		const markup = renderToStaticMarkup(<AdminPage />);

		expect(markup).toContain("Page Loader");
	});

	test("renders an admin access warning when overview loading fails", () => {
		adminState.error = new Error("Forbidden");

		const markup = renderToStaticMarkup(<AdminPage />);

		expect(markup).toContain("restricted to administrators only");
		expect(markup).toContain("Moderation");
	});

	test("renders the overview metrics, recent activity, and moderation queue", () => {
		const markup = renderToStaticMarkup(<AdminPage />);

		expect(markup).toContain("Users");
		expect(markup).toContain(">10<");
		expect(markup).toContain("Spam pulse");
		expect(markup).toContain("Need water");
		expect(markup).toContain("Toolbox");
		expect(markup).toContain("Moderation Queue");
		expect(markup).toContain("Misleading location");
		expect(markup).toContain("Verified pulse");
		expect(markup).toContain("This report has already been reviewed.");
	});

	test("wires moderation actions for pending reports", () => {
		renderToStaticMarkup(<AdminPage />);

		const removePulseButton = buttonProps.find(
			(props) => labelOf(props.children) === "Remove pulse",
		);
		const dismissButton = buttonProps.find(
			(props) => labelOf(props.children) === "Dismiss report",
		);
		const keepPulseButton = buttonProps.find(
			(props) => labelOf(props.children) === "Keep pulse",
		);

		removePulseButton?.onPress?.();
		dismissButton?.onPress?.();
		keepPulseButton?.onPress?.();

		expect(mutateCalls).toEqual([
			{
				reportId: "report-queue-1",
				status: "RESOLVED",
				pulseStatus: "DISMISSED",
				moderationNote: "Dismissed after moderator review",
			},
			{
				reportId: "report-queue-1",
				status: "DISMISSED",
				moderationNote: "Report dismissed by moderator",
			},
			{
				reportId: "report-queue-1",
				status: "RESOLVED",
				pulseStatus: "RESOLVED",
				moderationNote: "Report resolved, pulse retained",
			},
		]);
		expect(toastSuccessCalls).toEqual([
			"Report resolved",
			"Report dismissed",
			"Report resolved and pulse retained",
		]);
	});
});
