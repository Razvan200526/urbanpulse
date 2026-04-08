import { InputAvatar } from "@client/components/input/InputAvatar";
import { H2 } from "@client/components/typography";
import { Chip, cn } from "@heroui/react";
import { MailCheck, Star } from "lucide-react";

export const ProfileIdentitySection = ({
	name,
	email,
	image,
	defaultImage,
	trustRating,
	isEmailVerified,
	onAvatarChange,
}: {
	name: string;
	email: string;
	image: string | null;
	defaultImage: string | null;
	trustRating: number;
	isEmailVerified: boolean;
	onAvatarChange: (url: string) => void;
}) => {
	return (
		<div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-start">
				<InputAvatar
					value={image || defaultImage || undefined}
					onAvatarChange={onAvatarChange}
				/>
				<div className="space-y-3">
					<div className="space-y-1">
						<div className="flex items-center justify-start gap-2">
							<H2>{name}</H2>
							<div className="flex items-center gap-0.5">
								<p className="text-accent font-semibold">{trustRating}/10</p>
								<Star className="size-4 text-accent" fill="currentColor" />
							</div>
						</div>
						<p className="text-sm text-muted">{email}</p>
					</div>
					<div className="flex flex-wrap gap-2">
						<Chip
							className={cn(
								"rounded-full px-2 py-1",
								isEmailVerified ? "border-success" : "border-warning",
							)}
							color={isEmailVerified ? "success" : "warning"}
							variant="soft"
							size="sm"
						>
							<Chip.Label className="flex items-center gap-2">
								<MailCheck className="size-3" />
								{isEmailVerified ? "Email confirmed" : "Email unconfirmed"}
							</Chip.Label>
						</Chip>
					</div>
				</div>
			</div>
		</div>
	);
};
