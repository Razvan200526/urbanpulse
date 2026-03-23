import { Button } from "@client/components/Button/Button";
import { Header } from "@client/components/Header";
import { type TabItemType, Tabs } from "@client/components/tabs/Tabs";
import { Avatar, Badge, Card, Chip, Input, Separator } from "@heroui/react";
import {
	BookOpen,
	Filter,
	Globe,
	MoreVertical,
	PlusSquareIcon,
	Shield,
	Star,
	Wrench,
} from "lucide-react";

const RESOURCES = [
	{
		id: 1,
		title: "Emergency Medical Kit",
		category: "Medical",
		status: "Available",
		owner: "City Center Station",
		rating: 4.8,
		type: "Physical",
	},
	{
		id: 2,
		title: "Urban Rescue Training",
		category: "Skill",
		status: "Enrolled",
		owner: "Fire Dept.",
		rating: 4.9,
		type: "Educational",
	},
	{
		id: 3,
		title: "Volunteer Network",
		category: "Personnel",
		status: "Active",
		owner: "Community Hub",
		rating: 4.7,
		type: "Network",
	},
	{
		id: 4,
		title: "Drone Surveillance",
		category: "Tech",
		status: "Maintenance",
		owner: "Tech District",
		rating: 4.5,
		type: "Service",
	},
];
const tabItems: TabItemType[] = [
	{
		key: "All",
		label: "Resources",
		className: "text-accent",
	},
	{ key: "My Skills", label: "My Skills", className: "text-accent" },
	{ key: "Network", label: "Network", className: "text-accent" },
];

export const ResourcesPage = () => {
	return (
		<div className="flex flex-col h-full bg-background overflow-auto">
			<Header
				title="Skills & Resources"
				tabs={<Tabs items={tabItems} className="max-w-md ml-2" />}
				dropdown={
					<Button
						size="sm"
						variant="primary"
						startContent={<PlusSquareIcon className="size-5" />}
					>
						Request Resource
					</Button>
				}
			/>
			<Separator />

			<div className="p-6 space-y-6">
				{/* Search and Filter Bar */}
				<div className="flex flex-col sm:flex-row gap-4">
					<Input
						placeholder="Search for skills, equipment, or providers..."
						className="flex-1"
					/>
					<div className="flex gap-2">
						<Button variant="ghost">
							<Filter className="h-4 w-4" />
							Filter
						</Button>
						<Button variant="outline">Category</Button>
					</div>
				</div>

				{/* Abstract Grid Layout */}
				<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
					{RESOURCES.map((resource) => (
						<Card
							key={resource.id}
							className="group hover:shadow-lg transition-all duration-300 border border-border/50"
						>
							<Card.Header className="flex justify-between items-start">
								<div className="p-2 rounded-lg bg-primary/10 text-primary">
									{resource.category === "Medical" && (
										<Shield className="h-5 w-5" />
									)}
									{resource.category === "Skill" && (
										<BookOpen className="h-5 w-5" />
									)}
									{resource.category === "Personnel" && (
										<Globe className="h-5 w-5" />
									)}
									{resource.category === "Tech" && (
										<Wrench className="h-5 w-5" />
									)}
								</div>
								<Button size="sm" variant="ghost" isIconOnly>
									<MoreVertical className="h-4 w-4" />
								</Button>
							</Card.Header>

							<Card.Content className="space-y-3">
								<div>
									<h3 className="font-bold text-lg group-hover:text-primary transition-colors">
										{resource.title}
									</h3>
									<p className="text-sm text-foreground/50">{resource.owner}</p>
								</div>

								<div className="flex flex-wrap gap-2">
									<Badge
										color={
											resource.status === "Available" ? "accent" : "default"
										}
										variant="primary"
										size="sm"
									>
										{resource.status}
									</Badge>
									<Chip size="sm" variant="soft">
										{resource.type}
									</Chip>
								</div>

								<div className="flex items-center gap-1 mt-2">
									<Star className="h-3 w-3 text-warning fill-warning" />
									<span className="text-xs font-medium">{resource.rating}</span>
									<span className="text-xs text-foreground/30 ml-1">
										(120+ reviews)
									</span>
								</div>
							</Card.Content>

							<Separator className="opacity-50" />

							<Card.Footer className="flex justify-between items-center py-3 px-5">
								<div className="flex -space-x-2">
									<Avatar size="sm" className="border-2 border-surface">
										<Avatar.Image src="https://i.pravatar.cc/150?u=1" />
									</Avatar>
									<Avatar size="sm" className="border-2 border-surface">
										<Avatar.Image src="https://i.pravatar.cc/150?u=2" />
									</Avatar>
									<Avatar size="sm" className="border-2 border-surface">
										<Avatar.Image src="https://i.pravatar.cc/150?u=3" />
									</Avatar>
								</div>
								<Button
									size="sm"
									variant="ghost"
									className="text-primary font-medium"
								>
									Details
								</Button>
							</Card.Footer>
						</Card>
					))}
				</div>

				{/* Network Status / Info Section */}
				<Card className="bg-linear-to-r from-primary/5 to-secondary/5 border border-primary/20 p-6">
					<div className="flex flex-col md:flex-row items-center justify-between gap-6">
						<div className="flex items-center gap-4 text-center md:text-left">
							<div className="p-4 bg-primary rounded-full text-primary-foreground hidden md:block">
								<Globe className="h-8 w-8" />
							</div>
							<div>
								<h2 className="text-xl font-bold">
									Community Resource Exchange
								</h2>
								<p className="text-sm text-foreground/60 max-w-md mt-1">
									You have contributed 4 resources and helped 12 community
									members this month. Your reputation score is 98/100.
								</p>
							</div>
						</div>
						<div className="flex gap-3">
							<Button variant="primary">Share Resource</Button>
							<Button variant="ghost">View Achievements</Button>
						</div>
					</div>
				</Card>
			</div>
		</div>
	);
};
