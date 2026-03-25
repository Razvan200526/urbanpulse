import type { SVGProps } from "react";

export const MapIcon = (props: SVGProps<SVGSVGElement>) => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width={24}
		height={24}
		viewBox="0 0 24 24"
		{...props}
	>
		<g
			fill="none"
			stroke="currentColor"
			strokeLinecap="round"
			strokeLinejoin="round"
			strokeWidth={2}
		>
			<path d="M12 13a3 3 0 1 0 0-6a3 3 0 0 0 0 6"></path>
			<path d="M17.8 13.938h-.011a7 7 0 1 0-11.464.144h-.016l.14.171q.15.19.3.371L12 21l5.13-6.248q.291-.314.54-.659z"></path>
		</g>
	</svg>
);
