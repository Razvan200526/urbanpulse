import { Toast } from "@heroui/react";

export const RootProvider = ({ children }: { children: React.ReactNode }) => {
	return (
		<>
			<Toast.Provider placement="top" className="rounded-sm" />
			{children}
		</>
	);
};
