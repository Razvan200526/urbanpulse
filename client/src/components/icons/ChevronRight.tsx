import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & {
	secondaryfill?: string;
	strokewidth?: number;
	title?: string;
};

export const ChevronRightIcon = ({
	title = "badge 13",
	...props
}: IconProps) => {
	return (
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
					d="M11 3L24 16L11 29"
					fill="none"
					stroke="currentColor"
					strokeLinecap="square"
					strokeMiterlimit="10"
					strokeWidth="2"
				/>
			</g>
		</svg>
	);
};
