import { Button, Card, Separator, Toast } from "@heroui/react";
import { useRef } from "react";
import { Link } from "@client/components/Link";
import { Logo } from "../../components/icons/Logo";
import {
	InputEmail,
	type InputEmailRefType,
} from "../../components/input/InputEmail";
import {
	InputPassword,
	type InputPasswordRefType,
} from "../../components/input/InputPassword";
import { H1 } from "../../components/typography";
import { useSignIn } from "./hooks";
import { useNavigate } from "react-router";
import { isSignInInfoValid } from "@shared/validators/isSignInInfoValid";

export const SignInPage = () => {
	const emailRef = useRef<InputEmailRefType>(null);
	const passwordRef = useRef<InputPasswordRefType>(null);
	const { mutateAsync: signIn, isPending } = useSignIn();
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
		navigate("/home");
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
						<h2 className="text-2xl font-bold text-(--foreground)">
							Welcome Back
						</h2>
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

					<div className="pb-2 flex items-center justify-center gap-2">
						<p className="text-sm font-semibold text-foreground">
							Don't have an account?
						</p>
						<Link
							to="/signup"
							className="text-sm font-semibold text-(--primary)"
						>
							Sign Up
						</Link>
					</div>
				</Card>
			</div>
		</div>
	);
};
