import { UserProfile } from "../UserProfile";
import { Header } from "./Header";
import { NavMenu } from "./NavMenu";

export const Sidebar = () => {
	return (
		<div className="flex h-full min-h-0 flex-col gap-4">
			<Header />

			<NavMenu />

			<UserProfile />
		</div>
	);
};
