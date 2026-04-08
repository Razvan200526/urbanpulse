import { beforeEach, describe, expect, mock, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";

const alertsState = {
	user: { user: { id: "user-1" } },
	notifications: [] as Array<any>,
	isPending: false,
	acceptPending: false,
	rejectPending: false,
	isMobile: false,
	routeNotificationId: null as string | null,
	navigateCalls: [] as string[],
};

const buttonProps: Array<Record<string, any>> = [];
const acceptCalls: Array<unknown> = [];
const rejectCalls: Array<unknown> = [];
const toastSuccessCalls: string[] = [];
const toastDangerCalls: string[] = [];

mock.module("react-router", () => ({
	useNavigate: () => (path: string) => {
		alertsState.navigateCalls.push(path);

		if (path === "/alerts") {
			alertsState.routeNotificationId = null;
			return;
		}

		const match = path.match(/^\/alerts\/(.+)$/);
		alertsState.routeNotificationId =
			match?.[1] ?? alertsState.routeNotificationId;
	},
	useParams: () => ({
		notificationId: alertsState.routeNotificationId ?? undefined,
	}),
}));

mock.module("@client/hooks/useMediaQuery", () => ({
	useIsMobile: () => alertsState.isMobile,
}));

mock.module("@client/hooks/useAuth", () => ({
	useAuth: () => ({
		data: alertsState.user,
	}),
}));

mock.module("@client/hooks/useNotifications", () => ({
	useNotifications: () => ({
		data: alertsState.notifications,
		isPending: alertsState.isPending,
	}),
}));

mock.module("@client/pages/map/hooks", () => ({
	useAcceptHelpOffer: () => ({
		isPending: alertsState.acceptPending,
		mutate: (
			payload: unknown,
			options?: { onSuccess?: () => void; onError?: (error: Error) => void },
		) => {
			acceptCalls.push(payload);
			options?.onSuccess?.();
		},
	}),
	useRejectHelpOffer: () => ({
		isPending: alertsState.rejectPending,
		mutate: (
			payload: unknown,
			options?: { onSuccess?: () => void; onError?: (error: Error) => void },
		) => {
			rejectCalls.push(payload);
			options?.onSuccess?.();
		},
	}),
}));

mock.module("@client/components/Button/Button", () => ({
	Button: (props: Record<string, any>) => {
		buttonProps.push(props);
		return <button>{props.children}</button>;
	},
}));

mock.module("@client/components/Dropdown", () => ({
	Dropdown: ({
		trigger,
		items,
	}: {
		trigger: React.ReactNode;
		items: Array<{ label: React.ReactNode }>;
	}) => (
		<div>
			{trigger}
			<div>{items.map((item) => item.label).join(" | ")}</div>
		</div>
	),
}));

mock.module("@client/components/Header", () => ({
	Header: ({ title }: { title: string }) => <h1>{title}</h1>,
}));

mock.module("@client/components/user/Avatar", () => ({
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
	const Modal = ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	);
	Modal.Backdrop = () => <div>Modal Backdrop</div>;
	Modal.Container = ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	);
	Modal.Dialog = ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	);
	Modal.Header = ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	);
	Modal.Heading = ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	);
	Modal.Body = ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	);
	Modal.Footer = ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	);
	const Tooltip = ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	);
	Tooltip.Trigger = ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	);
	Tooltip.Content = ({ children }: { children: React.ReactNode }) => (
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
	const HeroButton = (props: Record<string, any>) => (
		<button onClick={props.onPress}>{props.children}</button>
	);
	const Chip = ({ children }: { children: React.ReactNode }) => (
		<span>{children}</span>
	);
	Chip.Label = ({ children }: { children: React.ReactNode }) => (
		<span>{children}</span>
	);
	const Skeleton = ({
		children,
		...props
	}: {
		children?: React.ReactNode;
		[key: string]: unknown;
	}) => <div {...props}>{children}</div>;
	const Drawer = ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	);
	Drawer.Trigger = ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	);
	Drawer.Backdrop = ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	);
	Drawer.Content = ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	);
	Drawer.Dialog = ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	);
	Drawer.Header = ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	);
	Drawer.Heading = ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	);
	Drawer.Body = ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	);

	return {
		Button: HeroButton,
		Card,
		Chip,
		Drawer,
		Modal,
		ProgressCircle: () => <div>Progress Circle</div>,
		Skeleton,
		ScrollShadow: ({ children }: { children: React.ReactNode }) => (
			<div>{children}</div>
		),
		Separator: () => <hr />,
		Table,
		Toast,
		Tooltip,
		cn: (...classes: Array<string | false | null | undefined>) =>
			classes.filter(Boolean).join(" "),
	};
});

const { AlertsPage } = await import("./AlertsPage");
const { useAlertsPageStore } = await import("./store");

describe("AlertsPage", () => {
	beforeEach(() => {
		alertsState.notifications = [];
		alertsState.isPending = false;
		alertsState.acceptPending = false;
		alertsState.rejectPending = false;
		alertsState.isMobile = false;
		alertsState.routeNotificationId = null;
		alertsState.navigateCalls = [];
		buttonProps.length = 0;
		acceptCalls.length = 0;
		rejectCalls.length = 0;
		toastSuccessCalls.length = 0;
		toastDangerCalls.length = 0;
		useAlertsPageStore.setState({ filter: "all" });
	});

	test("renders loading skeletons while notifications are loading", () => {
		alertsState.isPending = true;

		const markup = renderToStaticMarkup(<AlertsPage />);

		expect(markup).toContain('aria-label="Loading alerts"');
		expect(markup).toContain('aria-label="Loading alert details"');
		expect(markup).not.toContain("No alerts yet.");
	});

	test("renders an empty state when there are no alerts", () => {
		const markup = renderToStaticMarkup(<AlertsPage />);

		expect(markup).toContain("No alerts yet.");
	});

	test("renders alert rows and wires quick actions for pulse responses", () => {
		alertsState.notifications = [
			{
				notification: {
					id: "notification-1",
					type: "PULSE_RESPONSE",
					payload: {
						pulseId: "pulse-1",
						responseId: "response-1",
						pulseTitle: "Need help",
						responderName: "Ana",
					},
				},
				user: {
					name: "Ana",
					email: "ana@example.com",
				},
			},
			{
				notification: {
					id: "notification-2",
					type: "HERO_ALERT",
					payload: {
						type: "Emergency",
						description: "Flood warning",
					},
				},
				user: null,
			},
		];

		const markup = renderToStaticMarkup(<AlertsPage />);

		expect(markup).toContain("Alerts");
		expect(markup).toContain("Ana");
		expect(markup).toContain("Help offer");
		expect(markup).toContain("Emergency");
		expect(markup).toContain("Alert Details");

		const acceptButton = buttonProps.find(
			(props) => props.children === "Accept",
		);
		const rejectButton = buttonProps.find(
			(props) => props.children === "Reject",
		);
		acceptButton?.onPress?.();
		rejectButton?.onPress?.();

		expect(acceptCalls).toEqual([
			{ pulseId: "pulse-1", responseId: "response-1" },
		]);
		expect(rejectCalls).toEqual([
			{ pulseId: "pulse-1", responseId: "response-1" },
		]);
		expect(toastSuccessCalls).toEqual([
			"Help offer accepted",
			"Help offer rejected",
		]);
	});

	test("renders the route-selected alert details from the url parameter", () => {
		alertsState.routeNotificationId = "notification-2";
		alertsState.notifications = [
			{
				notification: {
					id: "notification-1",
					type: "PULSE_RESPONSE",
					payload: {
						pulseId: "pulse-1",
						responseId: "response-1",
						pulseTitle: "Need help",
						responderName: "Ana",
					},
				},
				user: {
					name: "Ana",
					email: "ana@example.com",
				},
			},
			{
				notification: {
					id: "notification-2",
					type: "HERO_ALERT",
					payload: {
						type: "Emergency",
						description: "Flood warning",
					},
				},
				user: null,
			},
		];

		const markup = renderToStaticMarkup(<AlertsPage />);

		expect(markup).toContain("Emergency Alert - System");
		expect(markup).toContain("Resolve Alert");
	});
});
