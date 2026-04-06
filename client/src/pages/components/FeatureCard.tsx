import { useRef, useState } from "react";
import type { Feature } from "./featuresData";

const miniPanelClass =
	"rounded-xl border border-border/70 bg-surface/88 shadow-[0_6px_18px_color-mix(in_oklch,var(--foreground)_6%,transparent)] backdrop-blur-sm";

const FeatureVisual = ({
	visual,
	Icon,
}: {
	visual: Feature["visual"];
	Icon: Feature["icon"];
}) => {
	if (visual === "alerts") {
		return (
			<div className="absolute inset-x-5 bottom-5 grid gap-3 pr-16">
				<div className={`${miniPanelClass} flex items-start gap-3 p-3`}>
					<div className="mt-0.5 size-2 rounded-full bg-danger" />
					<div className="min-w-0 flex-1">
						<div className="h-2.5 w-24 rounded-full bg-foreground/14" />
						<div className="mt-2 h-2 w-full rounded-full bg-foreground/10" />
						<div className="mt-1.5 h-2 w-3/4 rounded-full bg-foreground/8" />
					</div>
				</div>
				<div className="grid grid-cols-[1fr_auto] gap-3">
					<div className={`${miniPanelClass} p-3`}>
						<div className="flex items-center gap-2">
							<div className="size-2 rounded-full bg-warning" />
							<div className="h-2 w-20 rounded-full bg-foreground/12" />
						</div>
						<div className="mt-2 h-2 w-2/3 rounded-full bg-foreground/9" />
					</div>
					<div className="rounded-xl border border-danger/20 bg-danger/8 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-danger">
						Live
					</div>
				</div>
			</div>
		);
	}

	if (visual === "map") {
		return (
			<div className="absolute inset-x-5 bottom-5 top-18 overflow-hidden rounded-2xl border border-border/60 bg-surface/72 shadow-sm">
				<div className="absolute inset-x-0 top-0 flex items-center justify-between border-b border-border/60 bg-surface/92 px-3 py-2">
					<div className="h-2.5 w-20 rounded-full bg-foreground/10" />
					<div className="rounded-lg border border-success/20 bg-success/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-success">
						Live
					</div>
				</div>

				<div
					aria-hidden="true"
					className="absolute inset-x-0 bottom-0 top-11 opacity-35"
					style={{
						backgroundImage:
							"linear-gradient(to right, var(--border) 1px, transparent 1px), linear-gradient(to bottom, var(--border) 1px, transparent 1px)",
						backgroundSize: "30px 30px",
					}}
				/>

				<div className="absolute left-[10%] top-[54%] h-18 w-28 rounded-[32px] border border-primary/18 bg-primary/8" />
				<div className="absolute left-[41%] top-[20%] h-22 w-28 rounded-[36px] border border-secondary/18 bg-secondary/8" />
				<div className="absolute right-[8%] top-[42%] h-20 w-24 rounded-[32px] border border-success/18 bg-success/8" />

				<div className="absolute inset-x-4 bottom-4 top-15">
					<div className="absolute left-[6%] top-[62%] h-[2px] w-[30%] rounded-full bg-primary/30" />
					<div className="absolute left-[31%] top-[48%] h-[2px] w-[22%] rounded-full bg-primary/26 rotate-[22deg]" />
					<div className="absolute left-[49%] top-[36%] h-[2px] w-[24%] rounded-full bg-primary/24 -rotate-[12deg]" />
					<div className="absolute left-[66%] top-[48%] h-[2px] w-[18%] rounded-full bg-primary/30" />
					<div className="absolute left-[34%] top-[26%] h-[18%] w-[2px] rounded-full bg-primary/16 -rotate-[38deg]" />

					<div className="absolute left-[14%] top-[58%] size-3 rounded-full border-2 border-surface bg-primary shadow-[0_0_0_5px_color-mix(in_oklch,var(--color-primary)_16%,transparent)]" />
					<div className="absolute left-[49%] top-[30%] size-3 rounded-full border-2 border-surface bg-secondary shadow-[0_0_0_5px_color-mix(in_oklch,var(--color-secondary)_14%,transparent)]" />
					<div className="absolute right-[13%] top-[45%] size-3 rounded-full border-2 border-surface bg-success shadow-[0_0_0_5px_color-mix(in_oklch,var(--success)_16%,transparent)]" />

					<div className="absolute bottom-1 right-1 rounded-xl border border-border/70 bg-surface/90 px-3 py-2 shadow-sm">
						<div className="flex items-center gap-2">
							<div className="size-2 rounded-full bg-success" />
							<div className="h-2 w-16 rounded-full bg-foreground/10" />
						</div>
						<div className="mt-1.5 h-2 w-11 rounded-full bg-foreground/8" />
					</div>
				</div>
			</div>
		);
	}

	if (visual === "response") {
		return (
			<div className="absolute inset-x-5 bottom-5 grid gap-3">
				<div
					className={`${miniPanelClass} flex items-center justify-between p-3`}
				>
					<div>
						<div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
							Response Window
						</div>
						<div className="mt-1 text-sm font-semibold text-foreground">
							12 nearby helpers
						</div>
					</div>
					<div className="rounded-lg bg-success/14 px-2.5 py-1 text-xs font-semibold text-success">
						48 sec
					</div>
				</div>
				<div className="flex gap-2">
					<div className="rounded-lg border border-success/20 bg-success/10 px-3 py-2 text-xs font-medium text-success">
						Report
					</div>
					<div className="rounded-lg border border-primary/20 bg-primary/10 px-3 py-2 text-xs font-medium text-primary">
						Request help
					</div>
					<div className="rounded-lg border border-border/70 bg-surface/80 px-3 py-2 text-xs font-medium text-foreground">
						Respond
					</div>
				</div>
			</div>
		);
	}

	if (visual === "local") {
		return (
			<div className="absolute inset-0">
				<div className="absolute left-1/2 top-[58%] -translate-x-1/2 -translate-y-1/2">
					<div className="absolute left-1/2 top-1/2 size-36 -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/14 bg-primary/6" />
					<div className="absolute left-1/2 top-1/2 size-24 -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/18 bg-primary/8" />
					<div className="absolute left-1/2 top-1/2 size-14 -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/24 bg-surface/88" />
					<div className="relative z-10 rounded-full border border-primary/20 bg-surface p-3 text-primary shadow-sm">
						<Icon className="size-6" />
					</div>
				</div>
				<div className="absolute bottom-6 left-5 rounded-xl border border-border/70 bg-surface/88 px-3 py-2 text-xs font-medium text-foreground shadow-sm">
					0.8 km radius
				</div>
				<div className="absolute bottom-6 right-5 rounded-xl border border-border/70 bg-surface/88 px-3 py-2 text-xs font-medium text-muted shadow-sm">
					Neighbourhood only
				</div>
			</div>
		);
	}

	return (
		<div className="absolute inset-x-5 bottom-5 grid gap-3">
			<div className={`${miniPanelClass} p-3`}>
				<div className="flex items-center gap-2">
					<div className="size-2 rounded-full bg-secondary" />
					<div className="h-2.5 w-24 rounded-full bg-foreground/12" />
				</div>
				<div className="mt-3 space-y-2">
					<div className="flex items-center gap-3">
						<div className="size-6 rounded-lg bg-secondary/12 text-secondary flex items-center justify-center">
							<Icon className="size-3.5" />
						</div>
						<div className="flex-1">
							<div className="h-2 w-3/4 rounded-full bg-foreground/12" />
							<div className="mt-1.5 h-2 w-1/2 rounded-full bg-foreground/8" />
						</div>
					</div>
					<div className="flex items-center gap-3">
						<div className="size-6 rounded-lg bg-primary/12" />
						<div className="flex-1">
							<div className="h-2 w-2/3 rounded-full bg-foreground/12" />
							<div className="mt-1.5 h-2 w-2/5 rounded-full bg-foreground/8" />
						</div>
					</div>
				</div>
			</div>
			<div className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-xl border border-border/70 bg-surface/88 px-3 py-2.5 shadow-sm">
				<div className="size-2 rounded-full bg-success" />
				<div className="h-2 w-full rounded-full bg-foreground/10" />
				<div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
					Now
				</div>
			</div>
		</div>
	);
};

export const FeatureCard = ({
	icon: Icon,
	label,
	title,
	description,
	gradient,
	visual,
}: Feature) => {
	const cardRef = useRef<HTMLDivElement>(null);
	const [glowPos, setGlowPos] = useState({ x: 50, y: 50 });
	const [isHovering, setIsHovering] = useState(false);

	const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
		const card = cardRef.current;
		if (!card) return;

		const rect = card.getBoundingClientRect();
		setGlowPos({
			x: ((event.clientX - rect.left) / rect.width) * 100,
			y: ((event.clientY - rect.top) / rect.height) * 100,
		});
	};

	return (
		<div
			ref={cardRef}
			onPointerMove={handlePointerMove}
			onPointerEnter={() => setIsHovering(true)}
			onPointerLeave={() => {
				setIsHovering(false);
				setGlowPos({ x: 50, y: 50 });
			}}
			className="group relative flex h-full cursor-default flex-col overflow-hidden rounded-2xl bg-surface transition-all duration-500 hover:-translate-y-1"
		>
			<div
				aria-hidden="true"
				className="pointer-events-none absolute inset-0 z-20 rounded-2xl outline-1 outline-border transition-colors duration-500 group-hover:outline-primary/30"
			/>

			{isHovering ? (
				<div
					aria-hidden="true"
					className="pointer-events-none absolute z-10 h-60 w-60 rounded-full bg-secondary/10 blur-3xl transition-opacity duration-300"
					style={{
						left: `${glowPos.x}%`,
						top: `${glowPos.y}%`,
						transform: "translate(-50%, -50%)",
					}}
				/>
			) : null}

			<div className="relative h-48 w-full overflow-hidden border-b border-border/60 bg-surface-secondary/45">
				<div
					aria-hidden="true"
					className={`absolute inset-0 bg-linear-to-br ${gradient} opacity-90 transition-transform duration-700 ease-out group-hover:scale-105`}
				/>
				<div
					aria-hidden="true"
					className="absolute inset-0 opacity-70"
					style={{
						background:
							"linear-gradient(135deg, color-mix(in oklch, var(--surface-secondary) 82%, transparent), transparent 58%), radial-gradient(circle at top right, color-mix(in oklch, var(--accent) 18%, transparent), transparent 35%)",
					}}
				/>
				<div
					aria-hidden="true"
					className="absolute inset-0 opacity-20"
					style={{
						backgroundImage:
							"linear-gradient(to right, var(--border) 1px, transparent 1px), linear-gradient(to bottom, var(--border) 1px, transparent 1px)",
						backgroundSize: "28px 28px",
					}}
				/>
				<div className="absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-surface via-surface/55 to-transparent" />

				<div className="absolute inset-x-6 top-6 flex items-start justify-between">
					<div className="rounded-full border border-primary/20 bg-surface/80 px-3 py-1 text-[11px] font-semibold tracking-[0.18em] text-primary uppercase backdrop-blur-sm">
						{label}
					</div>
					<div className="rounded-2xl border border-white/15 bg-surface/70 p-3 text-primary backdrop-blur-sm transition-transform duration-300 group-hover:scale-110">
						<Icon className="size-6" />
					</div>
				</div>

				<FeatureVisual visual={visual} Icon={Icon} />
			</div>

			<div className="relative z-10 flex flex-1 flex-col gap-2 p-6 pt-5">
				<h3 className="text-lg font-semibold tracking-tight text-foreground">
					{title}
				</h3>
				<p className="text-sm leading-relaxed text-muted">{description}</p>
			</div>
		</div>
	);
};
