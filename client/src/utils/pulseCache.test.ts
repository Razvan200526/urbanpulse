import { afterEach, describe, expect, test } from "bun:test";
import { queryClient } from "@client/lib/api/client";
import {
	PulseEnum,
	PulseStatusEnum,
	PulseUploadStateEnum,
	UrgencyEnum,
} from "@shared/types";
import { syncPulseInCache, upsertPulseForPayload } from "./pulseCache";
import type { ClientPulseType } from "./types";

function buildPulse(overrides: Partial<ClientPulseType> = {}): ClientPulseType {
	return {
		id: "pulse-1",
		type: PulseEnum.Skill,
		userId: "user-1",
		urgency: UrgencyEnum.Urgent,
		title: "Need help",
		description: "Nearby assistance needed",
		position: { x: 26.1, y: 44.4 },
		status: PulseStatusEnum.Active,
		pulseUploadState: PulseUploadStateEnum.Uploaded,
		audioUrl: null,
		imageUrls: [],
		requestedSkillTags: [],
		matchMetadata: {},
		isResolved: false,
		isVerified: false,
		mergedIntoPulseId: null,
		moderationNote: null,
		locationPrecision: "exact",
		createdAt: "2025-01-01T00:00:00.000Z",
		...overrides,
	};
}

afterEach(() => {
	queryClient.clear();
});

describe("pulse cache helpers", () => {
	test("updates map, feed, and detail query caches for matching pulses", () => {
		const payload = {
			position: { x: 26.1, y: 44.4 },
			radius: 500,
			status: PulseStatusEnum.Active,
		};
		const originalPulse = buildPulse();
		const updatedPulse = buildPulse({ title: "Updated request" });

		queryClient.setQueryData(
			["pulse", "detail", originalPulse.id],
			originalPulse,
		);
		queryClient.setQueryData(["pulse", "map", payload], [originalPulse]);
		queryClient.setQueryData(["pulse", "retrieve", payload], {
			message: "Pulses retrieved",
			data: [originalPulse],
		});

		syncPulseInCache(updatedPulse);

		expect(
			queryClient.getQueryData<ClientPulseType[]>(["pulse", "map", payload]),
		).toEqual([updatedPulse]);
		expect(
			queryClient.getQueryData<{ data: ClientPulseType[] }>([
				"pulse",
				"retrieve",
				payload,
			])?.data,
		).toEqual([updatedPulse]);
		expect(
			queryClient.getQueryData<ClientPulseType>([
				"pulse",
				"detail",
				originalPulse.id,
			]),
		).toEqual(updatedPulse);
	});

	test("removes pulses that no longer match the query payload", () => {
		const payload = {
			position: { x: 26.1, y: 44.4 },
			radius: 500,
			type: PulseEnum.Skill,
			status: PulseStatusEnum.Active,
		};
		const originalPulse = buildPulse({ type: PulseEnum.Skill });
		const updatedPulse = buildPulse({ type: PulseEnum.Item });

		expect(
			upsertPulseForPayload([originalPulse], updatedPulse, payload),
		).toEqual([]);
	});

	test("removes inactive pulses from active default queries", () => {
		const payload = {
			position: { x: 26.1, y: 44.4 },
			radius: 500,
		};
		const originalPulse = buildPulse();
		const resolvedPulse = buildPulse({
			status: PulseStatusEnum.Resolved,
			isResolved: true,
		});

		queryClient.setQueryData(["pulse", "map", payload], [originalPulse]);
		queryClient.setQueryData(["pulse", "retrieve", payload], {
			message: "Pulses retrieved",
			data: [originalPulse],
		});

		syncPulseInCache(resolvedPulse);

		expect(
			queryClient.getQueryData<ClientPulseType[]>(["pulse", "map", payload]),
		).toEqual([]);
		expect(
			queryClient.getQueryData<{ data: ClientPulseType[] }>([
				"pulse",
				"retrieve",
				payload,
			])?.data,
		).toEqual([]);
	});
});
