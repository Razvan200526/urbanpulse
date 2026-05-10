import { ExternalLink } from "@client/components/Link";
import {
	AtSign,
	Facebook,
	Github,
	Instagram,
	Mail,
	ShieldCheck,
} from "lucide-react";

const projectLinks = [
	{
		label: "Email",
		href: "mailto:hello@urbanpulse.example",
		icon: Mail,
	},
	{
		label: "Instagram",
		href: "https://www.instagram.com/urbanpulse-project",
		icon: Instagram,
	},
	{
		label: "Facebook",
		href: "https://www.facebook.com/urbanpulse-project",
		icon: Facebook,
	},
	{
		label: "X",
		href: "https://x.com/urbanpulse-project",
		icon: AtSign,
	},
	{
		label: "GitHub",
		href: "https://github.com/urbanpulse-project",
		icon: Github,
	},
];

const legalLinks = [
	{
		label: "Terms of Service",
		href: "/privacy-policy#terms-of-service",
	},
	{
		label: "Privacy Notice",
		href: "/privacy-policy",
	},
	{
		label: "Cookie Notice",
		href: "/privacy-policy#cookie-notice",
	},
	{
		label: "Data Rights Request",
		href: "/privacy-policy#data-rights",
	},
	{
		label: "Privacy Contact",
		href: "mailto:privacy@urbanpulse.app",
	},
];

export const FooterSection = () => {
	return (
		<footer className="border-t border-accent/20 bg-primary-950 text-white">
			<div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
				<div className="grid gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)_minmax(0,0.9fr)]">
					<div className="space-y-4">
						<div className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-white/72">
							<ShieldCheck className="size-4" />
							UrbanPulse
						</div>
						<p className="max-w-xl text-sm leading-7 text-white/82">
							Local updates, safer streets, and better neighborhood coordination
							in one place.
						</p>
						<p className="max-w-xl text-sm leading-7 text-white/64">
							We process only the minimum personal data required for community
							safety workflows and document matching, with strict redaction and
							limited retention rules.
						</p>
					</div>

					<div className="space-y-4">
						<h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-white/72">
							Project
						</h2>
						<div className="flex flex-col items-start justify-start gap-3">
							{projectLinks.map(({ label, href, icon: Icon }) => (
								<ExternalLink
									key={label}
									href={href}
									target="_blank"
									rel="noreferrer"
									className="inline-flex gap-2 items-center text-sm text-white/88 transition-colors hover:text-white"
								>
									<Icon className="size-6" />
									{label}
								</ExternalLink>
							))}
						</div>
					</div>

					<div className="space-y-4">
						<h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-white/72">
							Legal
						</h2>
						<div className="space-y-3">
							{legalLinks.map(({ label, href }) => (
								<ExternalLink
									key={label}
									href={href}
									target="_blank"
									rel="noreferrer"
									className="block text-sm text-white/88 transition-colors hover:text-white"
								>
									{label}
								</ExternalLink>
							))}
						</div>
					</div>
				</div>

				<div className="mt-12 flex flex-col gap-3 border-t border-white/12 pt-6 text-sm text-white/58 sm:flex-row sm:items-center sm:justify-between">
					<p>UrbanPulse 2026. Built for communities, by communities.</p>
					<p>Review legal policy sections before using document uploads.</p>
				</div>
			</div>
		</footer>
	);
};
