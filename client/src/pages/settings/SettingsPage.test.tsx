import { beforeEach, describe, expect, mock, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";

const settingsState = {
	profile: {
		user: {
			id: "user-1",
			role: "admin",
			isVerified: true,
			emailVerified: true,
		},
		quietHours: {
			startTime: "21:00",
			endTime: "06:00",
			days: ["Mon", "Tue", "Wed"],
		},
	},
	isPending: false,
};

const buttonProps: Array<Record<string, any>> = [];
const quietHoursCalls: Array<unknown> = [];
const deleteCalls: string[] = [];
const navigateCalls: Array<unknown> = [];
const toastSuccessCalls: string[] = [];
const toastDangerCalls: string[] = [];
let confirmResult = true;

mock.module("react-router", () => ({
	useNavigate: () => (path: string, options?: unknown) => {
		navigateCalls.push({ path, options });
	},
}));

mock.module("@client/hooks/useProfileSettings", () => ({
	useUserProfile: () => ({
		data: settingsState.profile,
		isPending: settingsState.isPending,
	}),
	useUpdateQuietHours: () => ({
		mutateAsync: async (payload: unknown) => {
			quietHoursCalls.push(payload);
		},
		isPending: false,
	}),
	useDeleteAccount: () => ({
		mutateAsync: async () => {
			deleteCalls.push("delete");
		},
		isPending: false,
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
	Card.Footer = ({ children }: { children: React.ReactNode }) => (
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

const { SettingsPage } = await import("./SettingsPage");

describe("SettingsPage", () => {
	beforeEach(() => {
		settingsState.isPending = false;
		settingsState.profile = {
			user: {
				id: "user-1",
				role: "admin",
				isVerified: true,
				emailVerified: true,
			},
			quietHours: {
				startTime: "21:00",
				endTime: "06:00",
				days: ["Mon", "Tue", "Wed"],
			},
		};
		buttonProps.length = 0;
		quietHoursCalls.length = 0;
		deleteCalls.length = 0;
		navigateCalls.length = 0;
		toastSuccessCalls.length = 0;
		toastDangerCalls.length = 0;
		confirmResult = true;
		globalThis.window = {
			confirm: () => confirmResult,
		} as Window & typeof globalThis;
	});

	test("renders a loader while the profile is loading", () => {
		settingsState.isPending = true;

		const markup = renderToStaticMarkup(<SettingsPage />);

		expect(markup).toContain("Page Loader");
	});

	test("renders quiet hours, account details, and danger zone content", () => {
		const markup = renderToStaticMarkup(<SettingsPage />);

		expect(markup).toContain("Quiet Hours");
		expect(markup).toContain("Account");
		expect(markup).toContain("Danger Zone");
		expect(markup).toContain("admin");
		expect(markup).toContain("Verified");
		expect(markup).toContain("Confirmed");
	});

	test("saves quiet hours with the current defaults", async () => {
		renderToStaticMarkup(<SettingsPage />);

		const saveButton = buttonProps.find((props) => props.children === "Save");
		await saveButton?.onPress?.();

		expect(quietHoursCalls).toEqual([
			{
				startTime: "22:00",
				endTime: "06:00",
				days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
			},
		]);
		expect(toastSuccessCalls).toContain("Quiet hours saved");
	});

	test("does not delete the account when confirmation is cancelled", async () => {
		confirmResult = false;

		renderToStaticMarkup(<SettingsPage />);

		const deleteButton = buttonProps.find(
			(props) => props.children === "Delete account",
		);
		await deleteButton?.onPress?.();

		expect(deleteCalls).toEqual([]);
		expect(navigateCalls).toEqual([]);
	});

	test("deletes the account and navigates home after confirmation", async () => {
		renderToStaticMarkup(<SettingsPage />);

		const deleteButton = buttonProps.find(
			(props) => props.children === "Delete account",
		);
		await deleteButton?.onPress?.();

		expect(deleteCalls).toEqual(["delete"]);
		expect(toastSuccessCalls).toContain("Account deleted");
		expect(navigateCalls).toEqual([{ path: "/", options: { replace: true } }]);
	});
});
