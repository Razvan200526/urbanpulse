import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & {
	secondaryfill?: string;
	strokewidth?: number;
	title?: string;
};

export const EyeOpenIcon = ({ title = "badge 13", ...props }: IconProps) => {
	return (
		<svg
			height="24"
			width="24"
			viewBox="0 0 24 24"
			xmlns="http://www.w3.org/2000/svg"
			{...props}
		>
			<title>{title}</title>
			<g fill="currentColor">
				<path
					d="m23.775,11.565c-.169-.35-4.225-8.565-11.775-8.565S.394,11.215.225,11.565l-.21.435.21.435c.169.35,4.224,8.565,11.775,8.565s11.606-8.215,11.775-8.565l.21-.435-.21-.435Zm-11.775,4.435c-2.206,0-4-1.794-4-4s1.794-4,4-4,4,1.794,4,4-1.794,4-4,4Z"
					fill="currentColor"
					strokeWidth="0"
				/>
			</g>
		</svg>
	);
};
