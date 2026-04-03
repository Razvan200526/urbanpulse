import { Button } from "@client/components/Button/Button";
import {
	Dropdown,
	type DropdownItemDataType,
} from "@client/components/Dropdown";
import { Header } from "@client/components/Header";
import { RequestIcon } from "@client/components/icons/RequestIcon";
import type { ModalRefType } from "@client/components/Modal";
import { type TabItemType, Tabs } from "@client/components/tabs/Tabs";
import { ScrollShadow, Separator } from "@heroui/react";
import { ChevronDownIcon, PlusSquareIcon } from "lucide-react";
import { parseAsString, useQueryState } from "nuqs";
import { useRef } from "react";
import { useNavigate } from "react-router";
import { AllResourcesTab } from "./components/AllResourcesTab";
import { MySkillsTab } from "./components/MySkillsTab";
import { NetworkTab } from "./components/NetworkTab";
import { UploadResourceModal } from "./components/UploadResourceModal";

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
	const navigate = useNavigate();
	const [activeTab, setActiveTab] = useQueryState(
		"tab",
		parseAsString.withDefault("resources"),
	);

	const mobileActionItems: DropdownItemDataType[] = [
		{
			key: "upload",
			label: "Upload",
			icon: <PlusSquareIcon className="size-4 text-accent" />,
			labelClassName: "text-foreground",
			onAction: () => uploadModalRef.current?.open(),
		},
		{
			key: "request",
			label: "Request",
			icon: <RequestIcon className="size-4 text-accent" />,
			labelClassName: "text-foreground",
			onAction: () => navigate("/map"),
		},
	];

	const renderActiveTab = () => {
		switch (activeTab) {
			case "my-skills":
				return (
					<MySkillsTab onUploadClick={() => uploadModalRef.current?.open()} />
				);
			case "network":
				return <NetworkTab />;
			case "resources":
				return <AllResourcesTab />;
			default:
				return <AllResourcesTab />;
		}
	};

	return (
		<div className="flex flex-col h-[calc(100dvh)] bg-surface overflow-hidden relative">
			<Header
				title="Skills & Resources"
				tabs={
					<div className="w-full">
						<div className="flex items-center justify-between gap-3 md:hidden">
							<Tabs
								items={tabItems}
								selectedKey={activeTab}
								onSelectionChange={(k) => setActiveTab(k as string)}
								className="min-w-0 flex-1"
							/>
							<Dropdown
								placement="bottom end"
								trigger={
									<button
										type="button"
										className="flex shrink-0 items-center gap-2 rounded-2xl border border-border bg-surface-secondary/70 px-4 py-3 text-sm font-medium text-foreground shadow-sm transition-colors duration-150 hover:bg-surface-secondary"
									>
										<span>Actions</span>
										<ChevronDownIcon className="size-4 text-accent" />
									</button>
								}
								items={mobileActionItems}
							/>
						</div>
						<div className="hidden md:block">
							<Tabs
								items={tabItems}
								selectedKey={activeTab}
								onSelectionChange={(k) => setActiveTab(k as string)}
								className="max-w-md ml-2"
							/>
						</div>
					</div>
				}
				dropdown={
					<Button
						className="hidden md:inline-flex"
						size="md"
						variant="primary"
						startContent={<RequestIcon className="size-4" />}
						onPress={() => navigate("/map")}
					>
						Request
					</Button>
				}
			>
				<Button
					className="hidden md:inline-flex"
					size="md"
					variant="primary"
					startContent={<PlusSquareIcon className="size-4" />}
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
