import { beforeEach, describe, expect, mock, test } from "bun:test";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";

const signInState = {
	email: "",
	password: "",
	signInResult: { token: "ok" } as unknown,
	isPending: false,
	isPendingSocial: false,
};

const navigateCalls: string[] = [];
const signInCalls: Array<unknown> = [];
const socialCalls: string[] = [];
const toastSuccessCalls: string[] = [];
const toastDangerCalls: string[] = [];
const heroButtons: Array<Record<string, any>> = [];

mock.module("react-router", () => ({
	useNavigate: () => (path: string) => {
		navigateCalls.push(path);
	},
}));

mock.module("@client/components/Link", () => ({
	Link: ({ to, children }: { to: string; children: React.ReactNode }) => (
		<a href={to}>{children}</a>
	),
}));

mock.module("@iconify/react", () => ({
	Icon: () => <span>Icon</span>,
}));

mock.module("@shared/validators/isSignInInfoValid", () => ({
	isSignInInfoValid: ({
		email,
		password,
	}: {
		email: string;
		password: string;
	}) =>
		Boolean(email && password && email.includes("@") && password.length >= 8),
}));

mock.module("@heroui/react", () => {
	const Button = (props: Record<string, any>) => {
		heroButtons.push(props);
		return <button>{props.children}</button>;
	};
	const Card = ({ children }: { children: React.ReactNode }) => (
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
		Button,
		Card,
		Separator: () => <hr />,
		Toast,
	};
});

mock.module("../../components/icons/Logo", () => ({
	Logo: () => <div>Logo</div>,
}));

mock.module("../../components/input/InputEmail", () => {
	return {
		InputEmail: React.forwardRef(
			(_props: unknown, ref: React.Ref<{ getValue: () => string }>) => {
				if (ref && typeof ref === "object") {
					ref.current = {
						getValue: () => signInState.email,
					};
				}
				React.useImperativeHandle(ref, () => ({
					getValue: () => signInState.email,
				}));
				return <div>Email Input</div>;
			},
		),
	};
});

mock.module("../../components/input/InputPassword", () => {
	return {
		InputPassword: React.forwardRef(
			(_props: unknown, ref: React.Ref<{ getValue: () => string }>) => {
				if (ref && typeof ref === "object") {
					ref.current = {
						getValue: () => signInState.password,
					};
				}
				React.useImperativeHandle(ref, () => ({
					getValue: () => signInState.password,
				}));
				return <div>Password Input</div>;
			},
		),
	};
});

mock.module("../../components/typography", () => ({
	H1: ({ children }: { children: React.ReactNode }) => <h1>{children}</h1>,
	H2: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
}));

mock.module("./hooks", () => ({
	useSignIn: () => ({
		mutateAsync: async (payload: unknown) => {
			signInCalls.push(payload);
			return signInState.signInResult;
		},
		isPending: signInState.isPending,
	}),
	useSignInSocial: () => ({
		mutateAsync: async (provider: string) => {
			socialCalls.push(provider);
		},
		isPending: signInState.isPendingSocial,
	}),
}));

const { SignInPage } = await import("./SigninPage");

describe("SignInPage", () => {
	beforeEach(() => {
		signInState.email = "";
		signInState.password = "";
		signInState.signInResult = { token: "ok" };
		signInState.isPending = false;
		signInState.isPendingSocial = false;
		navigateCalls.length = 0;
		signInCalls.length = 0;
		socialCalls.length = 0;
		toastSuccessCalls.length = 0;
		toastDangerCalls.length = 0;
		heroButtons.length = 0;
	});

	test("renders the sign-in form shell", () => {
		const markup = renderToStaticMarkup(<SignInPage />);

		expect(markup).toContain("UrbanPulse");
		expect(markup).toContain("Welcome Back");
		expect(markup).toContain("Email Input");
		expect(markup).toContain("Password Input");
		expect(markup).toContain("Forgot password?");
	});

	test("shows an error toast when sign-in input is invalid", async () => {
		signInState.email = "not-an-email";
		signInState.password = "short";

		renderToStaticMarkup(<SignInPage />);

		const signInButton = heroButtons[0];
		await signInButton?.onClick?.();

		expect(signInCalls).toEqual([]);
		expect(toastDangerCalls).toEqual(["Invalid email or password"]);
	});

	test("signs in successfully and navigates to the map", async () => {
		signInState.email = "user@example.com";
		signInState.password = "password123";

		renderToStaticMarkup(<SignInPage />);

		const signInButton = heroButtons[0];
		await signInButton?.onClick?.();

		expect(signInCalls).toEqual([
			{ email: "user@example.com", password: "password123" },
		]);
		expect(toastSuccessCalls).toEqual(["Signed in successfully"]);
		expect(navigateCalls).toEqual(["/map"]);
	});

	test("does not navigate when sign-in returns no data", async () => {
		signInState.email = "user@example.com";
		signInState.password = "password123";
		signInState.signInResult = null;

		renderToStaticMarkup(<SignInPage />);

		const signInButton = heroButtons[0];
		await signInButton?.onClick?.();

		expect(signInCalls).toEqual([
			{ email: "user@example.com", password: "password123" },
		]);
		expect(toastSuccessCalls).toEqual([]);
		expect(navigateCalls).toEqual([]);
	});

	test("wires social sign-in buttons", async () => {
		renderToStaticMarkup(<SignInPage />);

		await heroButtons[1]?.onPress?.();
		await heroButtons[2]?.onPress?.();

		expect(socialCalls).toEqual(["google", "github"]);
	});
});
