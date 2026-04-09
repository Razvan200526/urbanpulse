import { beforeEach, describe, expect, mock, test } from "bun:test";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";

const resourceState = {
	activeTab: "resources",
};

const modalState = {
	user: { user: { id: "user-1" } },
	coords: { lat: 44.4, long: 26.1 } as { lat: number; long: number } | null,
	isLocationLoading: false,
	name: "Community room",
	description: "A shared room for residents",
};

const navigateCalls: string[] = [];
const openCalls: string[] = [];
const buttonProps: Array<Record<string, any>> = [];
const uploadCalls: Array<Record<string, unknown>> = [];
const toastDangerCalls: string[] = [];
const toastSuccessCalls: string[] = [];

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

mock.module("@client/hooks/useAuth", () => ({
	useAuth: () => ({
		data: modalState.user,
	}),
}));

mock.module("@client/hooks/useGetGeolocation", () => ({
	useGetGeolocation: () => ({
		coords: modalState.coords,
		isLoading: modalState.isLocationLoading,
	}),
}));

mock.module("./hooks", () => ({
	useUploadResource: () => ({
		mutateAsync: async (payload: Record<string, unknown>) => {
			uploadCalls.push(payload);
			return { message: "Resource created successfully" };
		},
	}),
	useSubmitResourceReview: () => ({
		mutateAsync: async () => undefined,
		isPending: false,
	}),
	useGetPendingRequests: () => ({ data: [] }),
	useRespondToRequest: () => ({
		mutateAsync: async () => undefined,
		isPending: false,
	}),
	useRequestBorrow: () => ({
		mutate: () => undefined,
		isPending: false,
	}),
	useGetResourceTransaction: () => ({
		data: null,
		isLoading: false,
	}),
	useCompleteResourceTransaction: () => ({
		mutateAsync: async () => null,
		isPending: false,
	}),
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

mock.module("@client/components/Dropdown", () => ({
	Dropdown: ({
		trigger,
		items,
	}: {
		trigger: React.ReactNode;
		items: Array<{ label: React.ReactNode }>;
	}) => (
		<div>
			{trigger}
			<div>{items.map((item) => item.label).join(" | ")}</div>
		</div>
	),
}));

mock.module("@client/components/tabs/Tabs", () => ({
	Tabs: ({ selectedKey }: { selectedKey: string }) => (
		<div>Active Tab: {selectedKey}</div>
	),
}));

mock.module("@client/components/ImageUploader", () => ({
	ImageUploader: ({
		trigger,
	}: {
		trigger: (open: () => void) => React.ReactNode;
	}) => <div>{trigger(() => {})}</div>,
}));

mock.module("@client/components/input/InputName", () => ({
	InputName: React.forwardRef(
		(
			_props: unknown,
			ref: React.Ref<{
				getValue: () => string;
				setValue: (value: string) => void;
			}>,
		) => {
			if (ref && typeof ref === "object") {
				ref.current = {
					getValue: () => modalState.name,
					setValue: () => {},
				};
			}
			return <div>Name input</div>;
		},
	),
}));

mock.module("@client/components/input/ResponsiveChoiceField", () => ({
	ResponsiveChoiceField: ({
		label,
		items,
		selectedKey,
	}: {
		label: string;
		items: Array<{ label: string; key: string }>;
		selectedKey: string;
	}) => (
		<div>
			{label}:{selectedKey}:{items.map((item) => item.label).join(",")}
		</div>
	),
}));

mock.module("@client/components/Modal", () => ({
	Modal: ({
		modalRef,
		header,
		footer,
		children,
	}: {
		modalRef: React.RefObject<{ open: () => void; close: () => void } | null>;
		header: React.ReactNode;
		footer: React.ReactNode;
		children: React.ReactNode;
	}) => {
		if (modalRef) {
			(
				modalRef as {
					current: { open: () => void; close: () => void } | null;
				}
			).current = {
				open: () => {
					openCalls.push("open");
				},
				close: () => {},
			};
		}
		return (
			<div>
				{header}
				{children}
				{footer}
			</div>
		);
	},
}));

mock.module("@client/components/TextArea", () => ({
	TextArea: React.forwardRef(
		(
			_props: unknown,
			ref: React.Ref<{
				getValue: () => string;
				setValue: (value: string) => void;
			}>,
		) => {
			if (ref && typeof ref === "object") {
				ref.current = {
					getValue: () => modalState.description,
					setValue: () => {},
				};
			}
			return <div>Description input</div>;
		},
	),
}));

mock.module("@client/components/typography", () => ({
	H3: ({ children }: { children: React.ReactNode }) => <h3>{children}</h3>,
	H6: ({ children }: { children: React.ReactNode }) => <h6>{children}</h6>,
}));

mock.module("@client/utils/normalizeAssetUrl", () => ({
	normalizeAssetUrl: (url: string) => url,
}));

mock.module("@heroui/react", () => {
	const Tooltip = ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	);
	Tooltip.Trigger = ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	);
	Tooltip.Content = ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	);
	const Card = ({ children }: { children: React.ReactNode }) => (
		<section>{children}</section>
	);
	Card.Header = ({ children }: { children: React.ReactNode }) => (
		<header>{children}</header>
	);
	Card.Content = ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	);
	Card.Footer = ({ children }: { children: React.ReactNode }) => (
		<footer>{children}</footer>
	);

	return {
		Chip: ({ children }: { children: React.ReactNode }) => (
			<span>{children}</span>
		),
		Drawer: {
			Footer: ({ children }: { children: React.ReactNode }) => (
				<footer>{children}</footer>
			),
		},
		Card,
		ScrollShadow: ({ children }: { children: React.ReactNode }) => (
			<div>{children}</div>
		),
		Separator: () => <hr />,
		Toast: {
			toast: {
				danger: (message: string) => {
					toastDangerCalls.push(message);
				},
				success: (message: string) => {
					toastSuccessCalls.push(message);
				},
			},
		},
		Tooltip,
	};
});

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

const { UploadResourceModal: ActualUploadResourceModal } = await import(
	"./components/UploadResourceModal"
);

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

const resetState = () => {
	resourceState.activeTab = "resources";
	modalState.user = { user: { id: "user-1" } };
	modalState.coords = { lat: 44.4, long: 26.1 };
	modalState.isLocationLoading = false;
	modalState.name = "Community room";
	modalState.description = "A shared room for residents";
	navigateCalls.length = 0;
	openCalls.length = 0;
	buttonProps.length = 0;
	uploadCalls.length = 0;
	toastDangerCalls.length = 0;
	toastSuccessCalls.length = 0;
};

describe("UploadResourceModal", () => {
	beforeEach(resetState);

	test("renders Location as a valid resource type choice", () => {
		const markup = renderToStaticMarkup(
			<ActualUploadResourceModal modalRef={{ current: null }} />,
		);

		expect(markup).toContain("Resource Type:Skill:Skill,Item,Location");
		expect(markup).not.toContain("Space");
	});

	test("uploads a resource with geolocation-derived coordinates and no userId", async () => {
		renderToStaticMarkup(
			<ActualUploadResourceModal modalRef={{ current: null }} />,
		);

		await buttonProps.find((props) => props.children === "Upload")?.onPress?.();

		expect(uploadCalls).toEqual([
			{
				name: "Community room",
				description: "A shared room for residents",
				availability: "Available",
				resourceType: "Skill",
				position: { x: 26.1, y: 44.4 },
				imageUrls: [],
			},
		]);
		expect(uploadCalls[0]).not.toHaveProperty("userId");
		expect(toastSuccessCalls).toEqual(["Resource created successfully"]);
	});

	test("blocks uploads when geolocation is unavailable", async () => {
		modalState.coords = null;

		renderToStaticMarkup(
			<ActualUploadResourceModal modalRef={{ current: null }} />,
		);

		await buttonProps.find((props) => props.children === "Upload")?.onPress?.();

		expect(uploadCalls).toEqual([]);
		expect(toastDangerCalls).toEqual([
			"Location is required. Please enable geolocation in the browser.",
		]);
	});
});

describe("ResourcesPage", () => {
	beforeEach(resetState);

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
