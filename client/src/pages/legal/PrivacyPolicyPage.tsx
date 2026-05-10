import { Link } from "@client/components/Link";

export const PrivacyPolicyPage = () => {
	return (
		<main className="mx-auto min-h-screen w-full max-w-4xl px-4 py-12 text-foreground sm:px-6">
			<header className="space-y-3">
				<h1 className="text-3xl font-semibold">UrbanPulse Legal & Privacy</h1>
				<p className="text-sm text-muted">
					Last updated: May 10, 2026. This page covers privacy, terms, cookies,
					and data-rights workflows for UrbanPulse.
				</p>
				<Link to="/" className="text-sm">
					Back to home
				</Link>
			</header>

			<section id="privacy-notice" className="mt-8 space-y-3">
				<h2 className="text-xl font-semibold">Privacy Notice</h2>
				<p className="text-sm leading-7 text-muted">
					We collect account data, location context, and safety report metadata
					to provide neighborhood safety features. Lost-document uploads are
					processed with AI redaction before storage. If redaction fails, upload
					is rejected.
				</p>
			</section>

			<section id="terms-of-service" className="mt-8 space-y-3">
				<h2 className="text-xl font-semibold">Terms of Service</h2>
				<p className="text-sm leading-7 text-muted">
					Users must submit lawful, accurate reports and avoid harassment, doxxing,
					or misuse of emergency features. We may suspend abusive accounts and
					remove malicious content.
				</p>
			</section>

			<section id="cookie-notice" className="mt-8 space-y-3">
				<h2 className="text-xl font-semibold">Cookie Notice</h2>
				<p className="text-sm leading-7 text-muted">
					We use essential session cookies for authentication and security, plus
					optional analytics cookies for product quality and incident response.
				</p>
			</section>

			<section id="data-rights" className="mt-8 space-y-3">
				<h2 className="text-xl font-semibold">Data Rights Request</h2>
				<p className="text-sm leading-7 text-muted">
					You may request access, correction, deletion, or objection by contacting{" "}
					<a className="text-accent underline" href="mailto:privacy@urbanpulse.app">
						privacy@urbanpulse.app
					</a>
					. We verify identity before processing requests.
				</p>
			</section>
		</main>
	);
};
