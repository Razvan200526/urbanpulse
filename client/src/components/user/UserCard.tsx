import { useAuth } from "@client/hooks/useAuth";
import { useGetGeolocation } from "@client/hooks/useGetGeolocation";
import { Avatar, Card, Chip, Skeleton } from "@heroui/react";
import { fakeUser } from "./fakeUser";
import { useGetAddress } from "./hooks";
export const UserCard = () => {
	const { data } = useAuth();

	const { coords } = useGetGeolocation();
	const { data: address, isPending } = useGetAddress(coords?.lat, coords?.long);

	return (
		<Card
			variant="secondary"
			className="max-w-xl min-h-40 shadow-none border border-border hover:border-primary-300 transition-colors duration-150 ease-out"
		>
			<Card.Header className="border-b border-border-secondary">
				<Card.Title className="flex items-center justify-start gap-4">
					<Avatar className="ring-2 ring-accent">
						{data?.user.image && <Avatar.Image src={data?.user.image} />}
						<Avatar.Fallback>{data?.user.name?.[0]}</Avatar.Fallback>
					</Avatar>
					<span className="text-accent font-semibold text-lg truncate max-w-50">
						{data?.user.name}
					</span>
					<Chip variant="soft" color="accent" className="rounded-full">
						{fakeUser.trustScore}%
					</Chip>
				</Card.Title>
				<Card.Description className="py-2">
					{isPending ? <AddressSkeleton /> : address}
				</Card.Description>
			</Card.Header>
			<Card.Content className="truncate">
				{
					//@ts-expect-error i have to update the query response for type checking
					<span className="text-muted text-sm">{data?.user.bio}</span>
				}
			</Card.Content>
			<Card.Footer />
		</Card>
	);
};

export const AddressSkeleton = () => {
	return (
		<div className="shadow-panel w-full space-y-5 rounded-lg bg-transparent">
			<Skeleton className="h-4" />
		</div>
	);
};
