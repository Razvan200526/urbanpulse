import type { ClientUserType } from "@client/utils/types";
import { glass } from "@dicebear/collection";
import { createAvatar } from "@dicebear/core";
import { Avatar as HeroAvatar } from "@heroui/react";

type AvatarUser = Pick<ClientUserType, "image"> & Partial<ClientUserType>;

export const Avatar = ({ user }: { user?: AvatarUser | null }) => {
	let avatar: string = "";
	if (!user?.image) {
		avatar = createAvatar(glass, {
			seed: Math.random().toString(36).substring(7),
		}).toDataUri();
	}
	return (
		<HeroAvatar className="ring-2 ring-accent" size="sm">
			<HeroAvatar.Image src={user?.image || avatar} />
		</HeroAvatar>
	);
};
