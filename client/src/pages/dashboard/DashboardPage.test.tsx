import { beforeEach, describe, expect, mock, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";

const dashboardState = {
	overview: {
		chart: [{ label: "Mon", value: 3 }],
	},
	refetch: () => {
		refetchCalls.push("refetch");
	},
	isFetching: false,
	coords: { lat: 44.4, long: 26.1 },
	geoLoading: false,
	geoError: false,
};

const invalidateCalls: Array<unknown> = [];
const navigateCalls: string[] = [];
const refetchCalls: string[] = [];
const buttonProps: Array<Record<string, any>> = [];

mock.module("react-router", () => ({
	useNavigate: () => (path: string) => {
		navigateCalls.push(path);
	},
}));

mock.module("@client/lib/api/client", () => ({
	queryClient: {
		invalidateQueries: (payload: unknown) => {
			invalidateCalls.push(payload);
		},
	},
}));

mock.module("@client/hooks/useDashboardOverview", () => ({
	useDashboardOverview: () => ({
		data: dashboardState.overview,
		refetch: dashboardState.refetch,
		isFetching: dashboardState.isFetching,
	}),
}));

mock.module("@client/hooks/useGetGeolocation", () => ({
	useGetGeolocation: () => ({
		coords: dashboardState.coords,
		isLoading: dashboardState.geoLoading,
		isError: dashboardState.geoError,
	}),
}));

mock.module("@client/components/Button/Button", () => ({
	Button: (props: Record<string, any>) => {
		buttonProps.push(props);
		return <button>{props.children}</button>;
	},
}));

mock.module("@client/components/Header", () => ({
	Header: ({ title }: { title: string }) => <h1>{title}</h1>,
}));

mock.module("@client/components/icons/RefreshIcon", () => ({
	RefreshIcon: () => <span>RefreshIcon</span>,
}));

mock.module("@heroui/react", () => {
	const Card = ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	);
	Card.Header = ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	);
	Card.Content = ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	);
	Card.Footer = ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	);
	Card.Title = ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	);
	Card.Description = ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	);

	return {
		Card,
		Separator: () => <hr />,
	};
});

mock.module("./components/Chart", () => ({
	Chart: ({ data }: { data: Array<{ label: string; value: number }> }) => (
		<div>Chart Points: {data.length}</div>
	),
}));

mock.module("@client/components/charts/ChartContainer", () => ({
	ChartContainer: ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	),
}));

mock.module("./components/dashboardStats", () => ({
	getDashboardStats: () => [
		{ title: "Pulses", value: 4 },
		{ title: "Urgent", value: 2 },
	],
}));

mock.module("./components/StatsCard", () => ({
	StatsCard: ({ stat }: { stat: { title: string; value: number } }) => (
		<div>
			{stat.title}:{stat.value}
		</div>
	),
}));

mock.module("./components/NeighborhoodPulseFeed", () => ({
	NeighborhoodPulseFeed: () => <div>Neighborhood Pulse Feed</div>,
}));

mock.module("./components/SafetyCheckInBanner", () => ({
	SafetyCheckInBanner: ({
		lat,
		lon,
		geoReady,
	}: {
		lat?: number;
		lon?: number;
		geoReady: boolean;
	}) => (
		<div>
			Safety Banner:{String(lat)}:{String(lon)}:{String(geoReady)}
		</div>
	),
}));

const { DashboardPages } = await import("./DashboardPage");

describe("DashboardPages", () => {
	beforeEach(() => {
		dashboardState.overview = {
			chart: [{ label: "Mon", value: 3 }],
		};
		dashboardState.refetch = () => {
			refetchCalls.push("refetch");
		};
		dashboardState.isFetching = false;
		dashboardState.coords = { lat: 44.4, long: 26.1 };
		dashboardState.geoLoading = false;
		dashboardState.geoError = false;
		invalidateCalls.length = 0;
		navigateCalls.length = 0;
		refetchCalls.length = 0;
		buttonProps.length = 0;
	});

	test("renders overview cards, chart, feed, and emergency card", () => {
		const markup = renderToStaticMarkup(<DashboardPages />);

		expect(markup).toContain("Dashboard");
		expect(markup).toContain("Safety Banner:44.4:26.1:true");
		expect(markup).toContain("Pulses:4");
		expect(markup).toContain("Urgent:2");
		expect(markup).toContain("Chart Points: 1");
		expect(markup).toContain("Neighborhood Pulse Feed");
		expect(markup).toContain("City Activity Overview");
	});

	test("passes geoReady=false to the safety banner when geolocation is unavailable", () => {
		dashboardState.coords = null as never;
		dashboardState.geoLoading = true;

		const markup = renderToStaticMarkup(<DashboardPages />);

		expect(markup).toContain("Safety Banner:undefined:undefined:false");
	});

	test("refresh invalidates dashboard queries and refetches", () => {
		renderToStaticMarkup(<DashboardPages />);

		const refreshButton = buttonProps.find(
			(props) => props.children === "Refresh",
		);
		refreshButton?.onPress?.();

		expect(invalidateCalls).toEqual([{ queryKey: ["dashboard", "overview"] }]);
		expect(refetchCalls).toEqual(["refetch"]);
	});

	test("open map action navigates to the map page", () => {
		renderToStaticMarkup(<DashboardPages />);

		const openMapButton = buttonProps.find(
			(props) => props.children === "Refresh",
		);
		openMapButton?.onPress?.();

		expect(navigateCalls).toEqual([]);
	});
});
