import type { SVGProps } from "react";

export const AllIcon = (props: SVGProps<SVGSVGElement>) => {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width={48}
			height={48}
			viewBox="0 0 48 48"
			{...props}
		>
			<path
				fill="currentColor"
				stroke="currentColor"
				strokeLinejoin="round"
				strokeWidth={4}
				d="M18 6H8a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2Zm0 22H8a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V30a2 2 0 0 0-2-2ZM40 6H30a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2Zm0 22H30a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V30a2 2 0 0 0-2-2Z"
			></path>
		</svg>
	);
};
