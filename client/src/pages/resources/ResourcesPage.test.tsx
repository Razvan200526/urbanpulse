import { beforeEach, describe, expect, mock, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";

const resourceState = {
	activeTab: "resources",
};

const navigateCalls: string[] = [];
const openCalls: string[] = [];
const buttonProps: Array<Record<string, any>> = [];

mock.module("react-router", () => ({
	useNavigate: () => (path: string) => {
		navigateCalls.push(path);
	},
}));

mock.module("nuqs", () => ({
	parseAsString: {
		withDefault: (value: string) => value,
	},
	useQueryState: () => [
		resourceState.activeTab,
		(next: string) => {
			resourceState.activeTab = next;
		},
	],
}));

mock.module("@client/components/Button/Button", () => ({
	Button: (props: Record<string, any>) => {
		buttonProps.push(props);
		return <button>{props.children}</button>;
	},
}));

mock.module("@client/components/Header", () => ({
	Header: ({
		title,
		tabs,
		dropdown,
		children,
	}: {
		title: string;
		tabs?: React.ReactNode;
		dropdown?: React.ReactNode;
		children?: React.ReactNode;
	}) => (
		<div>
			<h1>{title}</h1>
			<div>{tabs}</div>
			<div>{dropdown}</div>
			<div>{children}</div>
		</div>
	),
}));

mock.module("@client/components/tabs/Tabs", () => ({
	Tabs: ({ selectedKey }: { selectedKey: string }) => (
		<div>Active Tab: {selectedKey}</div>
	),
}));

mock.module("@heroui/react", () => ({
	ScrollShadow: ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	),
	Separator: () => <hr />,
}));

mock.module("./components/AllResourcesTab", () => ({
	AllResourcesTab: () => <div>All Resources Tab</div>,
}));

mock.module("./components/MySkillsTab", () => ({
	MySkillsTab: ({ onUploadClick }: { onUploadClick: () => void }) => (
		<div>
			My Skills Tab
			<button type="button" onClick={onUploadClick}>
				Open Upload
			</button>
		</div>
	),
}));

mock.module("./components/NetworkTab", () => ({
	NetworkTab: () => <div>Network Tab</div>,
}));

mock.module("./components/UploadResourceModal", () => ({
	UploadResourceModal: ({
		modalRef,
	}: {
		modalRef: React.RefObject<{ open: () => void } | null>;
	}) => {
		if (modalRef) {
			(modalRef as { current: { open: () => void } | null }).current = {
				open: () => {
					openCalls.push("open");
				},
			};
		}
		return <div>Upload Resource Modal</div>;
	},
}));

const { ResourcesPage } = await import("./ResourcesPage");

describe("ResourcesPage", () => {
	beforeEach(() => {
		resourceState.activeTab = "resources";
		navigateCalls.length = 0;
		openCalls.length = 0;
		buttonProps.length = 0;
	});

	test("renders the resources tab by default", () => {
		const markup = renderToStaticMarkup(<ResourcesPage />);

		expect(markup).toContain("Skills &amp; Resources");
		expect(markup).toContain("Active Tab: resources");
		expect(markup).toContain("All Resources Tab");
		expect(markup).toContain("Upload Resource Modal");
	});

	test("renders the my skills tab", () => {
		resourceState.activeTab = "my-skills";

		const markup = renderToStaticMarkup(<ResourcesPage />);

		expect(markup).toContain("My Skills Tab");
		expect(markup).not.toContain("All Resources Tab");
	});

	test("renders the network tab", () => {
		resourceState.activeTab = "network";

		const markup = renderToStaticMarkup(<ResourcesPage />);

		expect(markup).toContain("Network Tab");
	});

	test("falls back to the resources tab for unknown query state", () => {
		resourceState.activeTab = "unknown";

		const markup = renderToStaticMarkup(<ResourcesPage />);

		expect(markup).toContain("All Resources Tab");
	});

	test("wires the request and upload actions", () => {
		renderToStaticMarkup(<ResourcesPage />);

		const requestButton = buttonProps.find(
			(props) => props.children === "Request",
		);
		const uploadButton = buttonProps.find(
			(props) => props.children === "Upload",
		);

		requestButton?.onPress?.();
		uploadButton?.onPress?.();

		expect(navigateCalls).toEqual(["/map"]);
		expect(openCalls).toEqual(["open"]);
	});
});
