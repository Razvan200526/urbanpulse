import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import logo from "../../assets/logo.svg";
import { SunIcon } from "../../components/icons/SunIcon";
import { MoonIcon } from "../../components/icons/MoonIcon";
import { MenuIcon } from "../../components/icons/MenuIcon";
import { CloseIcon } from "../../components/icons/CloseIcon";
import { Button } from "@heroui/react";

const navLinks = [
	{ label: "Features", href: "#features" },
	{ label: "How It Works", href: "#how-it-works" },
];

export const Navbar = () => {
	const [scrolled, setScrolled] = useState(false);
	const [mobileOpen, setMobileOpen] = useState(false);
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
					{/* Logo */}
					<a href="#hero" className="flex items-center gap-2 no-underline">
						<img src={logo} alt="UrbanPulse" className="h-8 w-8" />
						<span className="text-lg font-bold tracking-wide text-(--foreground)">
							UrbanPulse
						</span>
					</a>

					{/* Desktop nav */}
					<div className="hidden md:flex items-center gap-8">
						{navLinks.map((link) => (
							<a
								key={link.href}
								href={link.href}
								className="text-sm font-medium text-muted hover:text-(--foreground) transition-colors no-underline"
							>
								{link.label}
							</a>
						))}
						<button
							type="button"
							onClick={toggleTheme}
							className="p-2 rounded-full hover:bg-default transition-colors cursor-pointer"
							aria-label="Toggle theme"
						>
							{isDark ? (
								<SunIcon className="size-5 text-(--foreground)" />
							) : (
								<MoonIcon className="size-5 text-(--foreground)" />
							)}
						</button>
						<Button
							className="rounded-full"
							variant="primary"
							size="sm"
						>
							Sign Up
						</Button>
					</div>

					{/* Mobile buttons */}
					<div className="flex md:hidden items-center gap-2">
						<button
							type="button"
							onClick={toggleTheme}
							className="p-2 rounded-full hover:bg-default transition-colors cursor-pointer"
							aria-label="Toggle theme"
						>
							{isDark ? (
								<SunIcon className="size-5 text-(--foreground)" />
							) : (
								<MoonIcon className="size-5 text-(--foreground)" />
							)}
						</button>
						<button
							type="button"
							onClick={() => setMobileOpen(!mobileOpen)}
							className="p-2 rounded-full hover:bg-default transition-colors cursor-pointer"
							aria-label="Toggle menu"
						>
							{mobileOpen ? (
								<CloseIcon className="size-5 text-(--foreground)" />
							) : (
								<MenuIcon className="size-5 text-(--foreground)" />
							)}
						</button>
					</div>
				</div>
			</div>

			{/* Mobile drawer */}
			<AnimatePresence>
				{mobileOpen && (
					<motion.div
						initial={{ height: 0, opacity: 0 }}
						animate={{ height: "auto", opacity: 1 }}
						exit={{ height: 0, opacity: 0 }}
						transition={{ duration: 0.25 }}
						className="md:hidden overflow-hidden bg-(--overlay)/95 backdrop-blur-xl border-b border-border"
					>
						<div className="flex flex-col gap-4 px-4 py-6">
							{navLinks.map((link) => (
								<a
									key={link.href}
									href={link.href}
									onClick={() => setMobileOpen(false)}
									className="text-base font-medium text-(--foreground) no-underline"
								>
									{link.label}
								</a>
							))}
							<Button
								className="rounded-full w-full"
								variant="primary"
								size="md"
							>
								Sign Up
							</Button>
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</motion.nav>
	);
};
