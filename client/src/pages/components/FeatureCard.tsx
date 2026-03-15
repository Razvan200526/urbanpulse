import type { Feature } from "./featuresData";

export const FeatureCard = ({
	icon: Icon,
	title,
	description,
	gradient,
}: Feature) => {
	return (
		<div className="group relative h-full rounded-2xl border border-border bg-(--surface)/40 backdrop-blur-sm p-6 sm:p-8 transition-all duration-300 hover:shadow-xl hover:border-(--accent)/30 overflow-hidden">
			{/* Icon */}
			<div
				className={`mb-5 inline-flex items-center justify-center w-11 h-11 rounded-xl bg-linear-to-br ${gradient} shadow-lg`}
			>
				<Icon className="size-5 text-white" />
			</div>

			{/* Content */}
			<h3 className="text-lg font-semibold text-(--foreground) mb-2">
				{title}
			</h3>
			<p className="text-sm text-muted leading-relaxed">{description}</p>

			{/* Hover glow */}
			<div
				className={`absolute -inset-px rounded-2xl bg-linear-to-br ${gradient} opacity-0 group-hover:opacity-[0.07] transition-opacity duration-300 pointer-events-none`}
			/>
		</div>
	);
};
