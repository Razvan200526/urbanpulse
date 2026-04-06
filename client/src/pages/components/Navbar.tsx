import { AppDrawer } from "@client/components/AppDrawer";
import { Button } from "@client/components/Button/Button";
import { Link } from "@client/components/Link";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import logo from "../../assets/logo.svg";
import { MenuIcon } from "../../components/icons/MenuIcon";
import { MoonIcon } from "../../components/icons/MoonIcon";
import { SunIcon } from "../../components/icons/SunIcon";

const navLinks = [
	{ label: "Features", href: "#features" },
	{ label: "How It Works", href: "#how-it-works" },
];

export const Navbar = () => {
	const [scrolled, setScrolled] = useState(false);
	const navigate = useNavigate();
	const [isDark, setIsDark] = useState(() => {
		if (typeof window === "undefined") return false;
		return document.documentElement.classList.contains("dark");
	});

	useEffect(() => {
		const onScroll = () => setScrolled(window.scrollY > 20);
		window.addEventListener("scroll", onScroll, { passive: true });
		return () => window.removeEventListener("scroll", onScroll);
	}, []);

	const toggleTheme = () => {
		const html = document.documentElement;
		if (isDark) {
			html.classList.remove("dark");
			html.removeAttribute("data-theme");
		} else {
			html.classList.add("dark");
			html.setAttribute("data-theme", "dark");
		}
		setIsDark(!isDark);
	};

	return (
		<motion.nav
			initial={{ y: -100 }}
			animate={{ y: 0 }}
			transition={{ type: "spring", stiffness: 100, damping: 20 }}
			className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
				scrolled
					? "bg-(--overlay)/80 backdrop-blur-xl shadow-lg border-b border-border"
					: "bg-transparent"
			}`}
		>
			<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
				<div className="flex h-16 items-center justify-between">
					<a href="#hero" className="flex items-center gap-2 no-underline">
						<img src={logo} alt="UrbanPulse" className="h-8 w-8" />
						<span className="text-lg font-bold tracking-wide text-(--foreground)">
							UrbanPulse
						</span>
					</a>

					<div className="hidden md:flex items-center gap-8">
						{navLinks.map((link) => (
							<Link
								className="text-foreground text-sm"
								key={link.href}
								to={link.href}
							>
								{link.label}
							</Link>
						))}
						<Button
							radius="full"
							variant="ghost"
							isIconOnly
							onClick={toggleTheme}
							aria-label="Toggle theme"
							startContent={
								isDark ? (
									<SunIcon className="size-5 text-foreground" />
								) : (
									<MoonIcon className="size-5 text-foreground" />
								)
							}
						/>
						<Button
							className="rounded"
							variant="primary"
							size="sm"
							onClick={() => navigate("/signup")}
						>
							Sign Up
						</Button>
					</div>

					<div className="flex md:hidden items-center gap-2">
						<Button
							variant="outline"
							onClick={toggleTheme}
							className="p-2 rounded-full cursor-pointer"
							aria-label="Toggle theme"
							isIconOnly
						>
							{isDark ? (
								<SunIcon className="size-5 text-(--foreground)" />
							) : (
								<MoonIcon className="size-5 text-(--foreground)" />
							)}
						</Button>

						<AppDrawer
							trigger={
								<Button variant="ghost" isIconOnly className="rounded-full">
									<MenuIcon className="size-6" />
								</Button>
							}
							placement="top"
							mobilePlacement="top"
							backdrop="opaque"
							header={
								<div className="border-b border-border px-4 py-4">
									<h2 className="text-foreground">Menu</h2>
								</div>
							}
							footer={
								<div className="border-t border-border px-4 py-4">
									<Button
										variant="primary"
										className="w-full rounded"
										onClick={() => navigate("/signup")}
									>
										Sign Up
									</Button>
								</div>
							}
							contentClassName="w-full"
							dialogClassName="bg-background"
							bodyClassName="px-4 py-4"
						>
							<div className="flex flex-col gap-4 py-2">
								{navLinks.map((link) => (
									<a
										key={link.href}
										href={link.href}
										className="text-base font-medium text-(--foreground) no-underline"
									>
										{link.label}
									</a>
								))}
							</div>
						</AppDrawer>
					</div>
				</div>
			</div>
		</motion.nav>
	);
};
