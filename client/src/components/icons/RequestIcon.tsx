import type { SVGProps } from "react";

export const RequestIcon = (props: SVGProps<SVGSVGElement>) => {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width={16}
			height={16}
			viewBox="0 0 16 16"
			{...props}
		>
			<g
				fill="none"
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth={1.5}
			>
				<circle cx={12.5} cy={12.5} r={1.75}></circle>
				<circle cx={3.5} cy={12.5} r={1.75}></circle>
				<circle cx={3.5} cy={3.5} r={1.75}></circle>
				<path d="m9.25 1.75-1.5 2 1.5 2m3 4.5v-5c0-1-.5-1.5-1.5-1.5h-2m-5 2v4.5"></path>
			</g>
		</svg>
	);
};
