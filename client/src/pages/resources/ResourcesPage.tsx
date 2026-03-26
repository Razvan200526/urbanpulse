import { Button } from "@client/components/Button/Button";
import { Header } from "@client/components/Header";
import { type TabItemType, Tabs } from "@client/components/tabs/Tabs";
import { ScrollShadow, Separator } from "@heroui/react";
import { PlusSquareIcon, Wrench } from "lucide-react";
import { UploadResourceModal } from "./components/UploadResourceModal";
import type { ModalRefType } from "@client/components/Modal";
import { useRef } from "react";
import { parseAsString, useQueryState } from "nuqs";

import { AllResourcesTab } from "./components/AllResourcesTab";
import { MySkillsTab } from "./components/MySkillsTab";
import { NetworkTab } from "./components/NetworkTab";

const tabItems: TabItemType[] = [
	{
		key: "resources",
		label: "Resources",
		className: "text-accent",
	},
	{ key: "my-skills", label: "My Skills", className: "text-accent" },
	{ key: "network", label: "Network", className: "text-accent" },
];

export const ResourcesPage = () => {
	const uploadModalRef = useRef<ModalRefType>(null);
	const [activeTab, setActiveTab] = useQueryState(
		"tab",
		parseAsString.withDefault("resources"),
	);

	const renderActiveTab = () => {
		switch (activeTab) {
			case "my-skills":
				return (
					<MySkillsTab onUploadClick={() => uploadModalRef.current?.open()} />
				);
			case "network":
				return <NetworkTab />;
			case "resources":
			//to be implemented
			default:
				return <AllResourcesTab />;
		}
	};

	return (
		<div className="flex flex-col h-[calc(100dvh)] bg-surface overflow-hidden relative">
			<Header
				title="Skills & Resources"
				tabs={
					<Tabs
						items={tabItems}
						selectedKey={activeTab}
						onSelectionChange={(k) => setActiveTab(k as string)}
						className="max-w-md ml-2"
					/>
				}
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

			<ScrollShadow className="flex-1 p-6" size={10}>
				<div className="max-w-7xl mx-auto">{renderActiveTab()}</div>
			</ScrollShadow>

			<UploadResourceModal modalRef={uploadModalRef} />
		</div>
	);
};
