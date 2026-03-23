import { Link } from "@client/components/Link";
import { Button, Card, Separator, Toast } from "@heroui/react";
import { Icon } from "@iconify/react";
import { isSignInInfoValid } from "@shared/validators/isSignInInfoValid";
import { useRef } from "react";
import { useNavigate } from "react-router";
import { Logo } from "../../components/icons/Logo";
import {
	InputEmail,
	type InputEmailRefType,
} from "../../components/input/InputEmail";
import {
	InputPassword,
	type InputPasswordRefType,
} from "../../components/input/InputPassword";
import { H1, H2 } from "../../components/typography";
import { useSignIn, useSignInSocial } from "./hooks";

export const SignInPage = () => {
	const emailRef = useRef<InputEmailRefType>(null);
	const passwordRef = useRef<InputPasswordRefType>(null);
	const { mutateAsync: signIn, isPending } = useSignIn();
	const { mutateAsync: signInSocial, isPending: isPendingSocial } =
		useSignInSocial();
	const navigate = useNavigate();

	const handleSignIn = async () => {
		const email = emailRef.current?.getValue() || "";
		const password = passwordRef.current?.getValue() || "";

		if (!isSignInInfoValid({ email, password })) {
			Toast.toast.danger("Invalid email or password");
			return;
		}

		const signInData = await signIn({ email, password });
		if (!signInData) {
			return;
		}

		Toast.toast.success("Signed in successfully");
		navigate("/map");
	};

	return (
		<div className="flex h-[calc(100dvh)] items-center justify-center bg-background">
			<div className="flex flex-col items-center justify-center gap-8 px-4 pt-8 sm:px-6 w-full max-w-xl">
				<div className="flex items-center justify-center">
					<Logo className="h-16 w-16" />
					<H1>UrbanPulse</H1>
				</div>

				<Card className="flex w-full flex-col gap-6 p-8 border border-accent bg-surface">
					<div className="flex flex-col gap-2">
						<H2>Welcome Back</H2>
						<p className="text-sm text-muted">
							Sign in to your UrbanPulse account
						</p>
					</div>

					<Separator />

					<div className="flex flex-col gap-4">
						<InputEmail ref={emailRef} initialValue="" />
						<InputPassword
							ref={passwordRef}
							name="password"
							label="Password"
							placeholder="Enter your password"
							initialValue=""
							required
						/>
					</div>

					<div className="pt-2 flex items-center justify-end">
						<Button
							size="md"
							variant="primary"
							className="w-full rounded font-semibold"
							onClick={handleSignIn}
							isPending={isPending}
							isDisabled={isPending}
						>
							Sign In
						</Button>
					</div>

					<Separator />

					<div className="flex-row items-center justify-center space-y-4">
						<Button
							className="w-full"
							variant="outline"
							onPress={() => signInSocial("google")}
							isPending={isPendingSocial}
						>
							<Icon icon="devicon:google" />
							Sign in with Google
						</Button>
						<Button
							className="w-full"
							variant="outline"
							onPress={() => signInSocial("github")}
							isPending={isPendingSocial}
						>
							<Icon icon="ion:logo-github" />
							Sign in with GitHub
						</Button>
					</div>
					<Separator />
					<div className="pb-2 flex items-center justify-between gap-2">
						<Link to="/forgot-password" className="text-sm">
							Forgot password?
						</Link>
						<div className="flex items-center justify-center gap-2">
							<p className="text-sm font-semibold text-foreground">
								Don't have an account?
							</p>
							<Link to="/signup" className="text-sm">
								Sign Up
							</Link>
						</div>
					</div>
				</Card>
			</div>
		</div>
	);
};
