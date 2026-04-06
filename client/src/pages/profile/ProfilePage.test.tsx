import { beforeEach, describe, expect, mock, test } from "bun:test";
import { forwardRef, useImperativeHandle } from "react";
import { renderToStaticMarkup } from "react-dom/server";

const profileState = {
	profile: {
		user: {
			id: "user-1",
			name: "Daria",
			email: "daria@example.com",
			bio: "Neighbor volunteer",
			image: "avatar.png",
			emailVerified: true,
			trustScore: 82,
			successfulInteractions: 6,
		},
		skillTags: ["First Aid", "Logistics"],
	},
	isPending: false,
	resources: [
		{
			resource: {
				id: "resource-1",
				userId: "user-1",
			},
		},
		{
			resource: {
				id: "resource-2",
				userId: "user-2",
			},
		},
	],
};

const buttonProps: Array<Record<string, any>> = [];
const updateProfileCalls: Array<unknown> = [];
const updateSkillTagCalls: Array<unknown> = [];
const deleteAccountCalls: string[] = [];
const navigateCalls: Array<unknown> = [];
const toastSuccessCalls: string[] = [];
const toastDangerCalls: string[] = [];
const posthogCalls: Array<unknown> = [];
let posthogResetCalls = 0;

mock.module("react-router", () => ({
	useNavigate: () => (path: string, options?: unknown) => {
		navigateCalls.push({ path, options });
	},
}));

mock.module("@client/hooks/useProfileSettings", () => ({
	useUserProfile: () => ({
		data: profileState.profile,
		isPending: profileState.isPending,
	}),
	useUpdateUserProfile: () => ({
		mutateAsync: async (payload: unknown) => {
			updateProfileCalls.push(payload);
		},
		isPending: false,
	}),
	useUpdateSkillTags: () => ({
		mutateAsync: async (payload: unknown) => {
			updateSkillTagCalls.push(payload);
		},
		isPending: false,
	}),
	useDeleteAccount: () => ({
		mutateAsync: async () => {
			deleteAccountCalls.push("delete");
		},
		isPending: false,
	}),
	useUpdateQuietHours: () => ({
		mutateAsync: async () => {},
		isPending: false,
	}),
	useUpdateAlertPreferences: () => ({
		mutateAsync: async () => {},
		isPending: false,
	}),
}));

mock.module("@client/pages/resources/hooks", () => ({
	useFilterResources: () => ({
		data: profileState.resources,
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

mock.module("@client/components/input/InputAvatar", () => ({
	InputAvatar: () => <div>Input Avatar</div>,
}));

mock.module("@client/components/input/InputName", () => ({
	InputName: forwardRef((props: Record<string, any>, ref) => {
		useImperativeHandle(ref, () => ({
			getValue: () => props.initialValue ?? "",
			setValue: () => {},
			getErrorMessage: () => "",
			isValid: () => true,
			validate: () => true,
		}));
		return <div>Input Name</div>;
	}),
}));

mock.module("@client/components/TextArea", () => ({
	TextArea: forwardRef((props: Record<string, any>, ref) => {
		useImperativeHandle(ref, () => ({
			getValue: () => props.initialValue ?? "",
			setValue: () => {},
			getErrorMessage: () => "",
			isValid: () => true,
			validate: () => true,
		}));
		return <div>Text Area</div>;
	}),
}));

mock.module("@client/components/PageLoader", () => ({
	PageLoader: () => <div>Page Loader</div>,
}));

mock.module("@posthog/react", () => ({
	usePostHog: () => ({
		capture: (event: string, payload?: unknown) => {
			posthogCalls.push({ event, payload });
		},
		reset: () => {
			posthogResetCalls += 1;
		},
	}),
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
	const Chip = ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	);
	Chip.Label = ({ children }: { children: React.ReactNode }) => (
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
	const AlertDialog = ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	);
	AlertDialog.Backdrop = ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	);
	AlertDialog.Container = ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	);
	AlertDialog.Dialog = ({
		children,
	}: {
		children:
			| React.ReactNode
			| ((props: { close: () => void }) => React.ReactNode);
	}) => (
		<div>
			{typeof children === "function" ? children({ close: () => {} }) : children}
		</div>
	);
	AlertDialog.Header = ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	);
	AlertDialog.Icon = ({ children }: { children?: React.ReactNode }) => (
		<div>{children}</div>
	);
	AlertDialog.Heading = ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	);
	AlertDialog.Body = ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	);
	AlertDialog.Footer = ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	);

	return {
		AlertDialog,
		Card,
		Chip,
		ScrollShadow: ({ children }: { children: React.ReactNode }) => (
			<div>{children}</div>
		),
		Separator: () => <hr />,
		Toast,
		cn: (...classes: Array<string | false | null | undefined>) =>
			classes.filter(Boolean).join(" "),
	};
});

const { ProfilePage } = await import("./ProfilePage");

describe("ProfilePage", () => {
	beforeEach(() => {
		profileState.isPending = false;
		buttonProps.length = 0;
		updateProfileCalls.length = 0;
		updateSkillTagCalls.length = 0;
		deleteAccountCalls.length = 0;
		navigateCalls.length = 0;
		toastSuccessCalls.length = 0;
		toastDangerCalls.length = 0;
		posthogCalls.length = 0;
		posthogResetCalls = 0;
	});

	test("renders a loader while profile data is loading", () => {
		profileState.isPending = true;

		const markup = renderToStaticMarkup(<ProfilePage />);

		expect(markup).toContain("Page Loader");
	});

	test("renders the profile summary and editor sections", () => {
		const markup = renderToStaticMarkup(<ProfilePage />);

		expect(markup).toContain("Profile");
		expect(markup).toContain("Daria");
		expect(markup).toContain("daria@example.com");
		expect(markup).toContain("Trust rating");
		expect(markup).toContain("4.1");
		expect(markup).toContain("82 internal points");
		expect(markup).toContain("Email confirmed");
		expect(markup).toContain("Active offers");
		expect(markup).toContain("Successful interactions");
		expect(markup).toContain("Delete account");
		expect(markup).toContain("Delete my data");
		expect(markup).toContain("Input Avatar");
		expect(markup).toContain("Input Name");
		expect(markup).toContain("Text Area");
	});

	test("wires the save profile and save skill tag actions", async () => {
		renderToStaticMarkup(<ProfilePage />);

		await buttonProps
			.find((props) => props.children === "Save profile")
			?.onPress?.();
		await buttonProps
			.find((props) => props.children === "Save skills")
			?.onPress?.();

		expect(updateProfileCalls).toEqual([
			{
				name: "Daria",
				bio: "Neighbor volunteer",
				image: "avatar.png",
			},
		]);
		expect(updateSkillTagCalls).toEqual([
			{ tags: ["First Aid", "Logistics"] },
		]);
		expect(toastSuccessCalls).toEqual([
			"Profile updated",
			"Skill tags updated",
		]);
	});

	test("deletes the account from the profile page", async () => {
		renderToStaticMarkup(<ProfilePage />);

		await buttonProps
			.find((props) => props.children === "Delete my data")
			?.onPress?.();

		expect(deleteAccountCalls).toEqual(["delete"]);
		expect(toastSuccessCalls).toContain("Account deleted");
		expect(posthogCalls).toContainEqual({ event: "account_deleted", payload: undefined });
		expect(posthogResetCalls).toBe(1);
		expect(navigateCalls).toEqual([{ path: "/", options: { replace: true } }]);
	});
});
