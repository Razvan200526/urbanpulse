import { Button } from "@client/components/Button/Button";
import { Header } from "@client/components/Header";
import { InputSearch } from "@client/components/input/InputSearch";
import { type TabItemType, Tabs } from "@client/components/tabs/Tabs";
import { Card, ScrollShadow, Separator } from "@heroui/react";
import { Filter, Globe, PlusSquareIcon } from "lucide-react";
import { ResourceCard } from "./components/ResourceCard";
import { fakeResources } from "./components/fakeData";
import { H4 } from "@client/components/typography";
import { ShareIcon } from "@client/components/icons/ShareIcon";

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
		<div className="flex flex-col h-[calc(100dvh)] bg-background overflow-y-scroll">
			<Header
				title="Skills & Resources"
				tabs={<Tabs items={tabItems} className="max-w-md ml-2" />}
				dropdown={
					<Button
						size="sm"
						variant="primary"
						startContent={<PlusSquareIcon className="size-4" />}
					>
						Request Resource
					</Button>
				}
			/>
			<Separator />

			<ScrollShadow className="p-6 space-y-6" size={10}>
				<div className="flex flex-col items-center justify-between sm:flex-row gap-4">
					<InputSearch className="w-full max-w-2xl" />
					<div className="flex gap-2">
						<Button variant="primary">
							<Filter className="h-4 w-4" />
							Filter
						</Button>{" "}
					</div>
				</div>

				{/* Abstract Grid Layout */}
				<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
					{fakeResources.map((resource) => (
						<ResourceCard key={resource.id} resource={resource} />
					))}
				</div>

				<Card className="border border-border shadow-none p-6">
					<div className="flex flex-col md:flex-row items-center justify-between gap-6">
						<div className="flex items-center gap-4 text-center md:text-left">
							<div className="p-4 bg-surface-secondary rounded-full text-primary-foreground hidden md:block">
								<Globe className="h-8 w-8 text-accent" />
							</div>
							<div>
								<H4 className="text-xl font-bold">
									Community Resource Exchange
								</H4>
								<p className="text-sm text-muted max-w-md mt-1">
									You have contributed 4 resources and helped 12 community
									members this month. Your reputation score is 98/100.
								</p>
							</div>
						</div>
						<div className="flex gap-3">
							<Button
								variant="primary"
								startContent={<ShareIcon className="size-4" />}
							>
								Share Resource
							</Button>
							<Button variant="outline">View Achievements</Button>
						</div>
					</div>
				</Card>
			</ScrollShadow>
		</div>
	);
};
