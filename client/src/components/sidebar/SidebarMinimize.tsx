import { useAuth } from "@client/hooks/useAuth";
import { Avatar } from "@heroui/react";
import { HeaderMinimize } from "./HeaderMinimize";
import { NavMenu } from "./NavMenu";

export const SidebarMinimize = ({ onOpen }: { onOpen: () => void }) => {
	const { data: user } = useAuth();
	return (
		<>
			<HeaderMinimize />
			<NavMenu isMinimize={true} />
			<button
				type="button"
				onClick={onOpen}
				className="cursor-pointer flex hover:bg-hover w-full h-16 items-center justify-center px-2 py-4 rounded"
			>
				<Avatar className="w-8 h-8">
					<Avatar.Image src={user?.user.image || ""} />
				</Avatar>
			</button>
		</>
	);
};
