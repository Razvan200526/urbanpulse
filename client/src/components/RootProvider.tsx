import { useCrisisStore } from "@client/stores/crisisStore";
import { Toast } from "@heroui/react";
import { MotionConfig } from "motion/react";
import { useEffect } from "react";
import { useThemeStore } from "./sidebar/store";

export const RootProvider = ({ children }: { children: React.ReactNode }) => {
	const { isCrisisModeActive } = useCrisisStore();
	const { theme } = useThemeStore();

	useEffect(() => {
		const root = document.documentElement;
		const body = document.body;

		// Set theme
		const currentTheme = isCrisisModeActive ? "dark" : theme;
		root.setAttribute("data-theme", currentTheme);
		body.setAttribute("data-theme", currentTheme);
		root.classList.remove("light", "dark");
		root.classList.add(currentTheme);

		// Set crisis mode
		if (isCrisisModeActive) {
			root.setAttribute("data-crisis-mode", "true");
			body.setAttribute("data-crisis-mode", "true");
		} else {
			root.removeAttribute("data-crisis-mode");
			body.removeAttribute("data-crisis-mode");
		}
	}, [isCrisisModeActive, theme]);

	return (
		<MotionConfig transition={isCrisisModeActive ? { duration: 0 } : undefined}>
			<Toast.Provider placement="top" className="rounded-sm" />
			{children}
		</MotionConfig>
	);
};
