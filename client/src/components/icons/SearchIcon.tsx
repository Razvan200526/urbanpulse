import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & {
	secondaryfill?: string;
	strokewidth?: number;
	title?: string;
};

export const SearchIcon = ({ title = "badge 13", ...props }: IconProps) => (
	<svg
		height="32"
		width="32"
		viewBox="0 0 32 32"
		xmlns="http://www.w3.org/2000/svg"
		{...props}
	>
		<title>{title}</title>
		<g fill="currentColor" strokeLinecap="butt" strokeLinejoin="miter">
			<path
				d="m21.393,18.565l7.021,7.021c.781.781.781,2.047,0,2.828h0c-.781.781-2.047.781-2.828,0l-7.021-7.021"
				fill="none"
				stroke="currentColor"
				strokeMiterlimit="10"
				strokeWidth="2"
			/>
			<circle
				cx="13"
				cy="13"
				fill="none"
				r="10"
				stroke="currentColor"
				strokeLinecap="square"
				strokeMiterlimit="10"
				strokeWidth="2"
			/>
		</g>
	</svg>
);
