import { renderToString } from "hono/jsx/dom/server";

export interface OTPMailProps {
	otp: string;
	userName?: string;
}

const THEME = {
	accent: "#9d64e6",
	accentLight: "#f9f6ff", // Slightly lighter for a cleaner look
	background: "#fcfaff", // Very faint purple tint to match brand
	border: "#e6e2ef",
	foreground: "#1a1825",
	muted: "#6b677a",
	surface: "#ffffff",
	radius: "12px", // Main container radius
	otpRadius: "8px", // Smaller, tighter radius for the OTP box
} as const;

const LOGO_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`<svg width="100%" viewBox="0 0 680 680" xmlns="http://www.w3.org/2000/svg"><circle cx="340" cy="340" r="270" fill="none" stroke="#9d64e6" stroke-width="12" opacity="0.18"/><circle cx="340" cy="340" r="246" fill="none" stroke="#9d64e6" stroke-width="2" opacity="0.3"/><rect x="108" y="388" width="22" height="80" rx="2" fill="#9d64e6" opacity="0.35"/><rect x="136" y="360" width="28" height="108" rx="2" fill="#9d64e6" opacity="0.65"/><rect x="170" y="375" width="18" height="93" rx="2" fill="#9d64e6" opacity="0.35"/><rect x="194" y="345" width="34" height="123" rx="2" fill="#9d64e6"/><rect x="209" y="325" width="4" height="20" rx="1" fill="#9d64e6"/><rect x="234" y="370" width="22" height="98" rx="2" fill="#9d64e6" opacity="0.65"/><rect x="262" y="310" width="38" height="158" rx="2" fill="#9d64e6"/><rect x="279" y="288" width="4" height="22" rx="1" fill="#9d64e6"/><rect x="306" y="355" width="26" height="113" rx="2" fill="#9d64e6" opacity="0.65"/><rect x="338" y="330" width="32" height="138" rx="2" fill="#9d64e6"/><rect x="344" y="318" width="20" height="12" rx="1" fill="#9d64e6"/><rect x="350" y="308" width="8" height="12" rx="1" fill="#9d64e6"/><rect x="376" y="350" width="28" height="118" rx="2" fill="#9d64e6" opacity="0.65"/><rect x="410" y="340" width="36" height="128" rx="2" fill="#9d64e6"/><rect x="426" y="318" width="4" height="22" rx="1" fill="#9d64e6"/><rect x="452" y="368" width="24" height="100" rx="2" fill="#9d64e6" opacity="0.65"/><rect x="482" y="382" width="20" height="86" rx="2" fill="#9d64e6" opacity="0.35"/><rect x="508" y="360" width="26" height="108" rx="2" fill="#9d64e6" opacity="0.65"/><rect x="540" y="390" width="18" height="78" rx="2" fill="#9d64e6" opacity="0.35"/><rect x="100" y="467" width="480" height="5" rx="2.5" fill="#9d64e6" opacity="0.2"/><circle cx="340" cy="230" r="10" fill="#9d64e6"/><path d="M 298 230 A 42 42 0 0 1 382 230" fill="none" stroke="#9d64e6" stroke-width="4" stroke-linecap="round" opacity="0.9"/><path d="M 270 230 A 70 70 0 0 1 410 230" fill="none" stroke="#9d64e6" stroke-width="3" stroke-linecap="round" opacity="0.65"/><path d="M 242 230 A 98 98 0 0 1 438 230" fill="none" stroke="#9d64e6" stroke-width="2" stroke-linecap="round" opacity="0.4"/><path d="M 214 230 A 126 126 0 0 1 466 230" fill="none" stroke="#9d64e6" stroke-width="1.5" stroke-linecap="round" opacity="0.22"/><line x1="180" y1="302" x2="500" y2="302" stroke="#9d64e6" stroke-width="1" opacity="0.15"/></svg>`)}`;

const FONT_STACK =
	"'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

export function OTPMailTemplate({ otp, userName }: OTPMailProps) {
	const otpDigits = otp.replace(/\s/g, "").split("");

	return (
		<html lang="en">
			<head>
				<meta charSet="UTF-8" />
				<link
					href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;700;900&display=swap"
					rel="stylesheet"
				/>
				<style>{`
          * { font-family: ${FONT_STACK} !important; }
          body { -webkit-font-smoothing: antialiased; }
        `}</style>
			</head>
			<body
				style={{ margin: 0, padding: 0, backgroundColor: THEME.background }}
			>
				<table
					width="100%"
					cellPadding={0}
					cellSpacing={0}
					style={{ backgroundColor: THEME.background, padding: "60px 20px" }}
				>
					<tbody>
						<tr>
							<td align="center">
								<table
									width="100%"
									style={{
										maxWidth: "480px",
										backgroundColor: THEME.surface,
										borderRadius: THEME.radius,
										border: `1px solid ${THEME.border}`,
										boxShadow: "0 8px 24px rgba(157, 100, 230, 0.05)",
									}}
								>
									<tbody>
										{/* Header */}
										<tr>
											<td align="center" style={{ padding: "40px 40px 32px" }}>
												<img
													src={LOGO_SVG}
													width="60"
													height="60"
													alt="Logo"
													style={{ marginBottom: "16px" }}
												/>
												<h1
													style={{
														margin: 0,
														fontSize: "22px",
														fontWeight: 1500,
														fontFamily: "Montserrat",
														color: THEME.accent,
														letterSpacing: "1px",
														textTransform: "uppercase",
													}}
												>
													URBANPULSE
												</h1>
											</td>
										</tr>

										<tr>
											<td style={{ padding: "0 40px 40px" }}>
												<p
													style={{
														fontSize: "18px",
														color: THEME.foreground,
														fontWeight: 700,
														margin: "0 0 12px",
													}}
												>
													{userName ? `Hi ${userName},` : "Hello,"}
												</p>
												<p
													style={{
														fontSize: "15px",
														color: THEME.muted,
														lineHeight: "1.6",
														margin: "0 0 32px",
													}}
												>
													Please use the following verification code to complete
													your sign-in. For security, do not share this code.
												</p>

												{/* Updated OTP Container with Border and Smaller Radius */}
												<table
													width="100%"
													cellPadding={0}
													cellSpacing={0}
													style={{
														backgroundColor: THEME.accentLight,
														borderRadius: THEME.otpRadius,
														border: `2px solid ${THEME.accent}`, // Clearer accent border
														borderStyle: "solid",
													}}
												>
													<tbody>
														<tr>
															<td align="center" style={{ padding: "24px" }}>
																<div style={{ letterSpacing: "8px" }}>
																	{otpDigits.map((digit, index) => (
																		<span
																			key={index}
																			style={{
																				fontSize: "34px",
																				fontWeight: 700,
																				color: THEME.accent,
																				display: "inline-block",
																			}}
																		>
																			{digit}
																		</span>
																	))}
																</div>
															</td>
														</tr>
													</tbody>
												</table>

												<p
													style={{
														textAlign: "center",
														fontSize: "13px",
														color: THEME.muted,
														marginTop: "20px",
													}}
												>
													Expiring in{" "}
													<span
														style={{ fontWeight: 700, color: THEME.foreground }}
													>
														10 minutes
													</span>
													.
												</p>

												{/* Security Box */}
												<div
													style={{
														marginTop: "40px",
														padding: "20px",
														backgroundColor: "#fbfbfb",
														borderRadius: "8px",
														border: "1px solid #f0f0f0",
														textAlign: "center",
													}}
												>
													<p
														style={{
															margin: 0,
															fontSize: "12px",
															color: THEME.muted,
															lineHeight: "1.5",
														}}
													>
														<strong style={{ color: THEME.foreground }}>
															Did not request this?
														</strong>
														<br />
														If you didn't attempt to sign in, please ignore this
														email or reach out to our support team.
													</p>
												</div>
											</td>
										</tr>

										{/* Footer */}
										<tr>
											<td
												align="center"
												style={{
													padding: "20px 40px",
													borderTop: `1px solid ${THEME.border}`,
												}}
											>
												<p
													style={{
														margin: 0,
														fontSize: "10px",
														color: "#aaa",
														textTransform: "uppercase",
														letterSpacing: "2px",
														fontWeight: 500,
													}}
												>
													&copy; 2026 UrbanPulse &bull; Intelligent Urban
													Solutions
												</p>
											</td>
										</tr>
									</tbody>
								</table>
							</td>
						</tr>
					</tbody>
				</table>
			</body>
		</html>
	);
}

export function OTPMail(props: OTPMailProps): string {
	const mail = <OTPMailTemplate {...props} />;
	return `<!DOCTYPE html>${renderToString(mail)}`;
}
