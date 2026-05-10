import { beforeEach, describe, expect, mock, test } from "bun:test";
import {
	PulseEnum,
	PulseStatusEnum,
	PulseUploadStateEnum,
	UrgencyEnum,
} from "@shared/types";
import { renderToStaticMarkup } from "react-dom/server";

const feedState = {
	isCrisisModeActive: false,
	coords: { lat: 44.4, long: 26.1 } as { lat: number; long: number } | null,
	geoError: null as string | null,
	pulses: [] as Array<Record<string, unknown>>,
};

const retrievePayloads: Array<Record<string, unknown>> = [];

const makePulse = (overrides: Record<string, unknown>) => ({
	id: crypto.randomUUID(),
	type: PulseEnum.Emergency,
	incidentTypeId: null,
	incidentType: null,
	userId: "user-1",
	urgency: UrgencyEnum.Immediate,
	title: "Emergency pulse",
	description: null,
	position: { x: 26.1, y: 44.4 },
	status: PulseStatusEnum.Active,
	pulseUploadState: PulseUploadStateEnum.Uploaded,
	audioUrl: null,
	imageUrls: [],
	requestedSkillTags: [],
	matchMetadata: {},
	isResolved: false,
	isVerified: false,
	authorRole: "user",
	authorTrustScore: 60,
	authorIsVerified: false,
	mergedIntoPulseId: null,
	moderationNote: null,
	createdAt: "2026-05-10T10:00:00.000Z",
	...overrides,
});

mock.module("react-router", () => ({
	useNavigate: () => () => undefined,
}));

mock.module("@client/hooks/useAuth", () => ({
	useAuth: () => ({
		data: { user: { id: "user-1" } },
	}),
}));

mock.module("@client/hooks/useGetGeolocation", () => ({
	useGetGeolocation: () => ({
		coords: feedState.coords,
		isError: feedState.geoError,
		refresh: () => undefined,
	}),
}));

mock.module("@client/pages/map/hooks", () => ({
	useRetrievePulses: (payload: Record<string, unknown>) => {
		retrievePayloads.push(payload);
		return {
			data: { data: feedState.pulses },
			isPending: false,
		};
	},
}));

mock.module("@client/stores/crisisStore", () => ({
	useCrisisStore: (
		selector: (state: { isCrisisModeActive: boolean }) => unknown,
	) => selector({ isCrisisModeActive: feedState.isCrisisModeActive }),
}));

mock.module("@client/components/Button/Button", () => ({
	Button: ({ children }: { children: React.ReactNode }) => (
		<button>{children}</button>
	),
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
	Card.Title = ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	);

	return {
		Card,
		ScrollShadow: ({ children }: { children: React.ReactNode }) => (
			<div>{children}</div>
		),
	};
});

mock.module("./PulseList", () => ({
	PulseList: ({ pulses }: { pulses: Array<{ title: string }> }) => (
		<div>{pulses.map((pulse) => pulse.title).join(" | ")}</div>
	),
}));

const { NeighborhoodPulseFeed } = await import("./NeighborhoodPulseFeed");

describe("NeighborhoodPulseFeed", () => {
	beforeEach(() => {
		feedState.isCrisisModeActive = false;
		feedState.coords = { lat: 44.4, long: 26.1 };
		feedState.geoError = null;
		feedState.pulses = [
			makePulse({
				id: "pulse-standard",
				type: PulseEnum.Emergency,
				title: "Standard alert",
				urgency: UrgencyEnum.Immediate,
				createdAt: "2026-05-10T10:00:00.000Z",
				authorTrustScore: 40,
			}),
			makePulse({
				id: "pulse-trusted",
				type: PulseEnum.Emergency,
				title: "Trusted alert",
				urgency: UrgencyEnum.Immediate,
				createdAt: "2026-05-10T09:30:00.000Z",
				authorTrustScore: 95,
			}),
			makePulse({
				id: "pulse-verified",
				type: PulseEnum.Emergency,
				title: "Verified alert",
				urgency: UrgencyEnum.Urgent,
				createdAt: "2026-05-10T09:45:00.000Z",
				authorTrustScore: 82,
				authorIsVerified: true,
			}),
			makePulse({
				id: "pulse-admin",
				type: PulseEnum.Emergency,
				title: "Admin alert",
				urgency: UrgencyEnum.Immediate,
				createdAt: "2026-05-10T08:45:00.000Z",
				authorRole: "admin",
				authorTrustScore: 98,
				authorIsVerified: true,
			}),
			makePulse({
				id: "pulse-skill",
				type: PulseEnum.Skill,
				title: "Volunteer electrician",
				urgency: UrgencyEnum.Urgent,
				createdAt: "2026-05-10T09:00:00.000Z",
			}),
			makePulse({
				id: "pulse-item",
				type: PulseEnum.Item,
				title: "Water crate",
				urgency: UrgencyEnum.NotUrgent,
				createdAt: "2026-05-10T08:00:00.000Z",
			}),
		];
		retrievePayloads.length = 0;
	});

	test("prioritizes only emergency pulses and hides general filters during crisis mode", () => {
		feedState.isCrisisModeActive = true;

		const markup = renderToStaticMarkup(<NeighborhoodPulseFeed />);

		expect(markup).toContain("CRISIS ACTIVE NEAR YOU");
		expect(markup).toContain("Priority feed");
		expect(markup).toContain("Emergency");
		expect(markup).toContain("Community");
		expect(markup).toContain(
			"Admin alert | Verified alert | Trusted alert | Standard alert",
		);
		expect(markup).not.toContain("Volunteer electrician");
		expect(markup).not.toContain("Water crate");
		expect(markup).not.toContain("All types");
		expect(markup).not.toContain("All urgency");
		expect(markup).not.toContain("Resolved");
		expect(retrievePayloads[0]).toEqual({
			position: { x: 26.1, y: 44.4 },
			radius: 500,
			status: PulseStatusEnum.Active,
		});
	});

	test("keeps the standard mixed feed and filters outside crisis mode", () => {
		const markup = renderToStaticMarkup(<NeighborhoodPulseFeed />);

		expect(markup).toContain("All types");
		expect(markup).toContain("All urgency");
		expect(markup).toContain("Resolved");
		expect(markup).toContain("Admin alert");
		expect(markup).toContain("Verified alert");
		expect(markup).toContain("Trusted alert");
		expect(markup).toContain("Standard alert");
		expect(markup).toContain("Volunteer electrician");
		expect(markup).toContain("Water crate");
		expect(retrievePayloads[0]).toEqual({
			position: { x: 26.1, y: 44.4 },
			radius: 500,
			status: PulseStatusEnum.Active,
		});
	});
});
