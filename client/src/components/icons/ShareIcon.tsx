import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & {
	secondaryfill?: string;
	strokewidth?: number;
	title?: string;
};

export const ShareIcon = ({ title = "badge 13", ...props }: IconProps) => {
	return (
		<svg
			height="24"
			width="24"
			viewBox="0 0 24 24"
			xmlns="http://www.w3.org/2000/svg"
			{...props}
		>
			<title>{title}</title>
			<g fill="currentColor" strokeLinecap="butt" strokeLinejoin="miter">
				<path
					d="m3,16v3c0,1.105.895,2,2,2h14c1.105,0,2-.895,2-2v-3"
					fill="none"
					stroke="currentColor"
					strokeLinecap="square"
					strokeMiterlimit="10"
					strokeWidth="2"
				/>
				<polyline
					fill="none"
					points="12 15 12 3 12 4"
					stroke="currentColor"
					strokeLinecap="square"
					strokeMiterlimit="10"
					strokeWidth="2"
				/>
				<polyline
					fill="none"
					points="17 8 12 3 7 8"
					stroke="currentColor"
					strokeLinecap="square"
					strokeMiterlimit="10"
					strokeWidth="2"
				/>
			</g>
		</svg>
	);
};
