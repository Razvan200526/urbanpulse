import { beforeEach, describe, expect, mock, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";

const profileState = {
	profile: {
		user: {
			id: "user-1",
			name: "Daria",
			email: "daria@example.com",
			bio: "Neighbor volunteer",
			image: "avatar.png",
			trustScore: 82,
			isVerified: true,
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
const toastSuccessCalls: string[] = [];
const toastDangerCalls: string[] = [];

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
	useUpdateQuietHours: () => ({
		mutateAsync: async () => {},
		isPending: false,
	}),
	useUpdateAlertPreferences: () => ({
		mutateAsync: async () => {},
		isPending: false,
	}),
	useDeleteAccount: () => ({
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

	return {
		Card,
		Chip,
		ScrollShadow: ({ children }: { children: React.ReactNode }) => (
			<div>{children}</div>
		),
		Separator: () => <hr />,
		Toast,
	};
});

const { ProfilePage } = await import("./ProfilePage");

describe("ProfilePage", () => {
	beforeEach(() => {
		profileState.isPending = false;
		buttonProps.length = 0;
		updateProfileCalls.length = 0;
		updateSkillTagCalls.length = 0;
		toastSuccessCalls.length = 0;
		toastDangerCalls.length = 0;
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
		expect(markup).toContain("Trust 82");
		expect(markup).toContain("Verified neighbour");
		expect(markup).toContain("Offers");
		expect(markup).toContain(">1<");
		expect(markup).toContain("Successful help");
		expect(markup).toContain(">6<");
		expect(markup).toContain("Identity");
		expect(markup).toContain("Skill Tags");
		expect(markup).toContain("Input Avatar");
	});

	test("wires the save profile and save skill tag actions", async () => {
		renderToStaticMarkup(<ProfilePage />);

		await buttonProps
			.find((props) => props.children === "Save profile")
			?.onPress?.();
		await buttonProps
			.find((props) => props.children === "Save skill tags")
			?.onPress?.();

		expect(updateProfileCalls).toEqual([
			{
				name: "",
				bio: "",
				image: null,
			},
		]);
		expect(updateSkillTagCalls).toEqual([[]]);
		expect(toastSuccessCalls).toEqual([
			"Profile updated",
			"Skill tags updated",
		]);
	});
});
