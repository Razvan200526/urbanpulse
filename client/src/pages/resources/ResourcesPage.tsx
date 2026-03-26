import { Button } from "@client/components/Button/Button";
import { Header } from "@client/components/Header";
import { InputSearch } from "@client/components/input/InputSearch";
import { type TabItemType, Tabs } from "@client/components/tabs/Tabs";
import { ScrollShadow, Separator } from "@heroui/react";
import { Filter, PlusSquareIcon, Wrench } from "lucide-react";
// import { ResourceCard } from "./components/ResourceCard";
import { UploadResourceModal } from "./components/UploadResourceModal";
import type { ModalRefType } from "@client/components/Modal";
import { useRef } from "react";
// import { useRetrieveResources } from "./hooks";
// import { useAuth } from "@client/hooks/useAuth";

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
	// const { data: user } = useAuth();
	// const { data: resources } = useRetrieveResources(user?.user.id || "");
	const uploadModalRef = useRef<ModalRefType>(null);

	return (
		<div className="flex flex-col h-[calc(100dvh)] bg-background overflow-y-scroll">
			<Header
				title="Skills & Resources"
				tabs={<Tabs items={tabItems} className="max-w-md ml-2" />}
				dropdown={
					<Button
						size="md"
						variant="primary"
						startContent={<PlusSquareIcon className="size-4" />}
					>
						Request
					</Button>
				}
			>
				<Button
					size="md"
					variant="primary"
					startContent={<Wrench className="size-4" />}
					onPress={() => uploadModalRef.current?.open()}
				>
					Upload
				</Button>
			</Header>
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

				<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
					{/*{resources?.map((resource) => (
						<ResourceCard key={resource.id} resource={resource} />
					))}*/}
				</div>
			</ScrollShadow>
			<UploadResourceModal modalRef={uploadModalRef} />
		</div>
	);
};
