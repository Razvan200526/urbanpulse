import { beforeEach, describe, expect, mock, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";

const mapState = {
	coords: { lat: 44.4, long: 26.1 },
	isError: false,
	isLoading: false,
	user: { user: { id: "user-1" } },
	profile: {
		alertPreferences: {
			heroAlertRadiusMeters: 1200,
		},
	},
	pulses: {
		data: [
			{
				id: "pulse-1",
				title: "Water needed",
				position: { x: 26.1, y: 44.4 },
			},
			{
				id: "pulse-2",
				title: "Medical help",
				position: { x: 26.11, y: 44.41 },
			},
		],
	},
	locationState: null as { safetyCheckin?: boolean } | null,
};

const retrieveCalls: Array<unknown> = [];

mock.module("react-router", () => ({
	useNavigate: () => () => {},
	useLocation: () => ({
		pathname: "/map",
		state: mapState.locationState,
	}),
}));

mock.module("@client/hooks/useGetGeolocation", () => ({
	useGetGeolocation: () => ({
		coords: mapState.coords,
		isError: mapState.isError,
		isLoading: mapState.isLoading,
	}),
}));

mock.module("@client/hooks/useAuth", () => ({
	useAuth: () => ({
		data: mapState.user,
	}),
}));

mock.module("@client/hooks/useProfileSettings", () => ({
	useUserProfile: () => ({
		data: mapState.profile,
	}),
}));

mock.module("@client/components/Button/Button", () => ({
	Button: ({ children }: { children: React.ReactNode }) => (
		<button>{children}</button>
	),
}));

mock.module("@client/components/icons/SignalIcon", () => ({
	SignalIcon: () => <span>SignalIcon</span>,
}));

mock.module("@client/components/PageLoader", () => ({
	PageLoader: () => <div>Page Loader</div>,
}));

mock.module("@client/components/map/MapComponent", () => ({
	MapComponent: ({
		children,
		center,
		zoom,
	}: {
		children: React.ReactNode;
		center: [number, number];
		zoom: number;
	}) => (
		<div>
			Map:{center.join(",")}:{zoom}
			{children}
		</div>
	),
}));

mock.module("@client/components/map/PulseHeatmapLayer", () => ({
	PulseHeatmapLayer: ({ pulses }: { pulses: Array<{ id: string }> }) => (
		<div>Heatmap:{pulses.length}</div>
	),
}));

mock.module("@client/components/PulseMarker", () => ({
	PulseMarker: ({ pulse }: { pulse: { id: string; title: string } }) => (
		<div>{pulse.title}</div>
	),
}));

mock.module("./hooks", () => ({
	useRetrieveMapPulses: (payload: unknown, enabled: boolean) => {
		retrieveCalls.push({ payload, enabled });
		return {
			data: mapState.pulses.data,
		};
	},
}));

mock.module("./components/CreatePulseModal", () => ({
	CreatePulseModal: ({
		coords,
		emergencyLaunch,
	}: {
		coords: { lat: number; long: number };
		emergencyLaunch: boolean;
	}) => (
		<div>
			Create Pulse Modal:{coords.lat}:{coords.long}:{String(emergencyLaunch)}
		</div>
	),
}));

const { MapPage } = await import("./MapPage");

describe("MapPage", () => {
	beforeEach(() => {
		mapState.coords = { lat: 44.4, long: 26.1 };
		mapState.isError = false;
		mapState.isLoading = false;
		mapState.user = { user: { id: "user-1" } };
		mapState.profile = {
			alertPreferences: {
				heroAlertRadiusMeters: 1200,
			},
		};
		mapState.pulses = {
			data: [
				{
					id: "pulse-1",
					title: "Water needed",
					position: { x: 26.1, y: 44.4 },
				},
				{
					id: "pulse-2",
					title: "Medical help",
					position: { x: 26.11, y: 44.41 },
				},
			],
		};
		mapState.locationState = null;
		retrieveCalls.length = 0;
	});

	test("renders a loader while location is still loading", () => {
		mapState.coords = null as never;
		mapState.isLoading = true;

		const markup = renderToStaticMarkup(<MapPage />);

		expect(markup).toContain("Page Loader");
	});

	test("renders the map, heatmap, markers, and modal when coordinates are available", () => {
		const markup = renderToStaticMarkup(<MapPage />);

		expect(markup).toContain("Map:26.1,44.4:");
		expect(markup).toContain("Heatmap:2");
		expect(markup).toContain("Water needed");
		expect(markup).toContain("Medical help");
		expect(markup).toContain("Create Pulse Modal:44.4:26.1:false");
		expect(markup).toContain("Create pulse");
		expect(markup).toContain("Emergency");
		expect(retrieveCalls).toEqual([
			{
				payload: {
					position: { x: 26.1, y: 44.4 },
					radius: 1200,
				},
				enabled: true,
			},
		]);
	});
});
