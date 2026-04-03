import { Separator } from "@heroui/react";
import { UserProfile } from "../UserProfile";
import { Header } from "./Header";
import { NavMenu } from "./NavMenu";

export const Sidebar = () => {
	return (
		<div className="flex h-full min-h-0 flex-col gap-4">
			<Header />

			<Separator className="p-0 m-0 w-full bg-accent" />
			<NavMenu />
			<Separator className="p-0 m-0 w-full bg-accent" />

			<UserProfile />
		</div>
	);
};
