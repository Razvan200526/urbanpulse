import { useAuth } from "@client/hooks/useAuth";
import { Avatar } from "@heroui/react";
import { UserIcon } from "../icons/UserIcon";
import { HeaderMinimize } from "./HeaderMinimize";
import { NavMenu } from "./NavMenu";

export const SidebarMinimize = ({ onOpen }: { onOpen: () => void }) => {
	const { data: user } = useAuth();
	return (
		<div className="flex h-full min-h-0 w-full flex-col justify-between">
			<HeaderMinimize />
			<div className="min-h-0 flex-1 py-4">
				<NavMenu isMinimize={true} />
			</div>
			<button
				type="button"
				onClick={onOpen}
				className="cursor-pointer flex hover:bg-hover w-full h-16 items-center justify-center px-2 py-4 rounded"
			>
				<Avatar className="w-8 h-8">
					<Avatar.Fallback>
						<UserIcon />
					</Avatar.Fallback>
					<Avatar.Image src={user?.user.image || ""} />
				</Avatar>
			</button>
		</div>
	);
};
