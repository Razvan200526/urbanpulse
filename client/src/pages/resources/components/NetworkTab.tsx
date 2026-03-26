import { Button } from "@client/components/Button/Button";
import { InputSearch } from "@client/components/input/InputSearch";
import { H6 } from "@client/components/typography";
import { Avatar } from "@client/components/user/Avatar";
import { Card, Chip } from "@heroui/react";
import { MapPin, Users } from "lucide-react";

type NetworkMember = {
	id: string;
	name: string;
	location: string;
	skills: string[];
	distance: string;
};

const fakeMembers: NetworkMember[] = [
	{
		id: "m1",
		name: "Alex Rivera",
		location: "Downtown",
		skills: ["Fixing Leaky Pipes", "Basic Electrical Repairs"],
		distance: "0.3 km away",
	},
	{
		id: "m2",
		name: "Jordan Lee",
		location: "Midtown",
		skills: ["Grocery Pickup", "Furniture Assembly", "Heavy Lifting Help"],
		distance: "0.8 km away",
	},
	{
		id: "m3",
		name: "Sam Patel",
		location: "East Side",
		skills: ["Tech Setup (WiFi, TV)", "Appliance Setup"],
		distance: "1.2 km away",
	},
	{
		id: "m4",
		name: "Morgan Chen",
		location: "West End",
		skills: ["Pet Care Help", "Yard Work / Gardening", "Cleaning & Tidying"],
		distance: "1.5 km away",
	},
	{
		id: "m5",
		name: "Casey Brooks",
		location: "Uptown",
		skills: ["Emergency Ride", "Package Pickup / Delivery"],
		distance: "2.1 km away",
	},
	{
		id: "m6",
		name: "Taylor Nguyen",
		location: "Riverside",
		skills: ["Car Battery Jumpstart", "Flat Tire Change"],
		distance: "2.4 km away",
	},
	{
		id: "m7",
		name: "Dana Kim",
		location: "Old Town",
		skills: ["Painting Walls", "Door Lock Fix"],
		distance: "3.0 km away",
	},
	{
		id: "m8",
		name: "Quinn Williams",
		location: "Northgate",
		skills: ["Basic Car Diagnostics", "Moving Assistance"],
		distance: "3.6 km away",
	},
];

const MemberCard = ({ member }: { member: NetworkMember }) => {
	return (
		<Card className="border border-border-secondary shadow-none hover:border-accent transition-colors duration-150">
			<Card.Header className="flex flex-row items-center gap-3">
				<Avatar />
				<div className="flex flex-col gap-0.5 min-w-0">
					<H6 className="truncate">{member.name}</H6>
					<span className="flex items-center gap-1 text-xs text-muted">
						<MapPin className="size-3 shrink-0" />
						{member.location} · {member.distance}
					</span>
				</div>
			</Card.Header>

			<Card.Content className="space-y-3">
				<div className="flex flex-wrap gap-1.5">
					{member.skills.slice(0, 3).map((skill) => (
						<Chip key={skill} variant="soft" color="accent" size="sm">
							<Chip.Label>{skill}</Chip.Label>
						</Chip>
					))}
					{member.skills.length > 3 && (
						<Chip variant="soft" color="default" size="sm">
							<Chip.Label>+{member.skills.length - 3} more</Chip.Label>
						</Chip>
					)}
				</div>
			</Card.Content>

			<Card.Footer className="pt-0">
				<Button variant="primary" size="sm" className="w-full">
					Connect
				</Button>
			</Card.Footer>
		</Card>
	);
};

export const NetworkTab = () => {
	return (
		<div className="space-y-6">
			<div className="flex flex-col sm:flex-row items-center justify-between gap-4">
				<div>
					<p className="text-sm font-medium text-foreground">
						People in your area
					</p>
					<p className="text-xs text-muted">
						{fakeMembers.length} neighbours sharing skills nearby
					</p>
				</div>
				<InputSearch
					className="w-full max-w-sm"
					placeholder="Search people..."
				/>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
				{fakeMembers.map((member) => (
					<MemberCard key={member.id} member={member} />
				))}
			</div>

			<div className="flex flex-col items-center justify-center py-10 gap-3">
				<div className="flex items-center gap-2 text-muted">
					<Users className="size-4" />
					<span className="text-sm">Showing people within 5 km</span>
				</div>
				<Button variant="outline" size="sm">
					Expand search radius
				</Button>
			</div>
		</div>
	);
};
