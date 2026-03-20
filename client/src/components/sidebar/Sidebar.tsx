import { Separator } from "@heroui/react";
import { UserProfile } from "../UserProfile";
import { Header } from "./Header";
import { NavMenu } from "./NavMenu";

export const Sidebar = () => {
	return (
		<>
			<Header />

			<Separator className="p-0 m-0 w-full bg-accent" />
			<NavMenu />
			<Separator className="p-0 m-0 w-full bg-accent" />

			<UserProfile />
		</>
	);
};
