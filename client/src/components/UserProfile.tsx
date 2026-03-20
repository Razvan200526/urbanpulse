import { useAuth } from "@client/hooks/useAuth";
import { Avatar, Button, Toast } from "@heroui/react";
import { Icon } from "@iconify/react";
import { LogOutIcon, UserIcon } from "lucide-react";
import { useNavigate } from "react-router";
import { CustomDropdown, type DropdownItemDataType } from "./Dropdown";
import { useSignOut } from "./sidebar/hooks";

export const UserProfile = () => {
	const { data } = useAuth();
	const navigate = useNavigate();
	const { mutateAsync: signOut } = useSignOut();

	const items: DropdownItemDataType[] = [
		{
			key: "profile",
			label: "Profile",
			labelClassName: "text-accent",
			icon: <UserIcon className="size-4 text-accent" />,
			onAction: () => navigate("/profile"),
		},
		{
			key: "signout",
			label: "Logout",
			labelClassName: "text-danger",
			icon: <LogOutIcon className="size-4 text-danger" />,
			onAction: async () => {
				const { data } = await signOut();
				if (data?.success) {
					Toast.toast.success("Signed out successfully");
					navigate("/");
				} else {
					Toast.toast.danger("Failed to sign out");
				}
			},
		},
	];

	return (
		<CustomDropdown
			placement="top end"
			className="border border-border"
			trigger={
				<Button
					className="h-20 w-full items-center justify-between px-4"
					variant="ghost"
				>
					<div className="flex items-center gap-3">
						<Avatar className="size-8 border border-accent">
							<Avatar.Image src={data?.user.image ?? ""} />
							<Avatar.Fallback>
								<UserIcon className="size-4" />
							</Avatar.Fallback>
						</Avatar>
						<div className="flex flex-col items-start text-left">
							<span className="text-sm text-accent font-semibold truncate max-w-30">
								{data?.user.name}
							</span>
							<span className="text-xs text-muted truncate max-w-30">
								{data?.user.email}
							</span>
						</div>
					</div>
					<Icon className="size-4 text-muted" icon="mi:select" />
				</Button>
			}
			items={items}
		/>
	);
};
