import { cn } from "@heroui/styles";
import React, { useLayoutEffect, useRef, useState } from "react";

const MIN_CHART_DIMENSION = 32;

const ChartContext = React.createContext<boolean>(false);

export const ChartContainer = ({
	className,
	children,
}: {
	className?: string;
	children: React.ReactNode;
}): React.ReactElement => {
	const containerRef = useRef<HTMLDivElement | null>(null);
	const [isReady, setIsReady] = useState(false);

	useLayoutEffect(() => {
		const el = containerRef.current;
		if (!el) {
			return;
		}
		const update = (rect = el.getBoundingClientRect()) => {
			if (
				rect.width >= MIN_CHART_DIMENSION &&
				rect.height >= MIN_CHART_DIMENSION
			) {
				setIsReady(true);
			}
		};

		update();
		if (typeof ResizeObserver === "undefined") return;

		const observer = new ResizeObserver((entries) => {
			for (const entry of entries) {
				if (entry.target === el) update(entry.contentRect);
			}
		});
		observer.observe(el);
		return () => observer.disconnect();
	}, []);

	return (
		<ChartContext.Provider value={isReady}>
			<div
				ref={containerRef}
				data-chart-ready={isReady}
				className={cn(
					"flex w-full min-w-0 min-h-50 aspect-video justify-center text-xs ...",
					!isReady && "opacity-0 pointer-events-none",
					className,
				)}
			>
				{isReady && children}
			</div>
		</ChartContext.Provider>
	);
};
