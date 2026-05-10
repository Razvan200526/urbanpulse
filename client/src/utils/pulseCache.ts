import { queryClient } from "@client/lib/api/client";
import { PulseStatusEnum } from "@shared/types";
import {
	type PulseRetrievePayloadType,
	retrievePulsePayloadSchema,
} from "@shared/validators/pulses/isPulseRetrieveValid";
import type { QueryKey } from "@tanstack/react-query";
import type { ClientPulseType } from "./types";

type PulseRetrieveSocketResult = {
	message: string;
	data: ClientPulseType[];
};

const DEFAULT_RADIUS_METERS = 500;

function distanceInMeters(
	a: { x: number; y: number },
	b: { x: number; y: number },
) {
	const earthRadiusMeters = 6371e3;
	const lat1 = (a.y * Math.PI) / 180;
	const lat2 = (b.y * Math.PI) / 180;
	const dLat = ((b.y - a.y) * Math.PI) / 180;
	const dLon = ((b.x - a.x) * Math.PI) / 180;
	const haversine =
		Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

	return (
		2 *
		earthRadiusMeters *
		Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine))
	);
}

function parseRetrievePayload(queryKey: QueryKey) {
	const parsed = retrievePulsePayloadSchema.safeParse(queryKey[2]);
	return parsed.success ? parsed.data : null;
}

function mergePulseRecord(
	existing: ClientPulseType | undefined,
	incoming: ClientPulseType,
): ClientPulseType {
	if (!existing) {
		return incoming;
	}

	return {
		...existing,
		...incoming,
		incidentTypeId: incoming.incidentTypeId ?? existing.incidentTypeId ?? null,
		incidentType: incoming.incidentType ?? existing.incidentType ?? null,
		authorRole: incoming.authorRole ?? existing.authorRole ?? null,
		authorTrustScore:
			incoming.authorTrustScore ?? existing.authorTrustScore ?? null,
		authorIsVerified:
			incoming.authorIsVerified ?? existing.authorIsVerified ?? null,
	};
}

export function doesPulseMatchRetrievePayload(
	pulse: ClientPulseType,
	payload: PulseRetrievePayloadType,
) {
	if (pulse.mergedIntoPulseId) {
		return false;
	}

	const status = payload.status ?? PulseStatusEnum.Active;
	if (pulse.status !== status) {
		return false;
	}

	if (payload.type && pulse.type !== payload.type) {
		return false;
	}

	if (payload.urgency && pulse.urgency !== payload.urgency) {
		return false;
	}

	if (payload.verifiedOnly && pulse.isVerified !== true) {
		return false;
	}

	const radius = payload.radius ?? DEFAULT_RADIUS_METERS;
	return distanceInMeters(payload.position, pulse.position) <= radius;
}

export function upsertPulseForPayload(
	oldPulses: ClientPulseType[] | undefined,
	pulse: ClientPulseType,
	payload: PulseRetrievePayloadType,
) {
	const next = new Map((oldPulses ?? []).map((entry) => [entry.id, entry]));

	if (!doesPulseMatchRetrievePayload(pulse, payload)) {
		next.delete(pulse.id);
		return Array.from(next.values());
	}

	next.set(pulse.id, mergePulseRecord(next.get(pulse.id), pulse));
	return Array.from(next.values());
}

export const syncPulseInCache = (pulse: ClientPulseType) => {
	queryClient.setQueryData<ClientPulseType>(
		["pulse", "detail", pulse.id],
		(oldPulse) => mergePulseRecord(oldPulse, pulse),
	);

	const mapQueries = queryClient
		.getQueryCache()
		.findAll({ queryKey: ["pulse", "map"] });
	for (const query of mapQueries) {
		const payload = parseRetrievePayload(query.queryKey);
		if (!payload) {
			continue;
		}

		queryClient.setQueryData<ClientPulseType[]>(query.queryKey, (oldPulses) =>
			upsertPulseForPayload(oldPulses, pulse, payload),
		);
	}

	const retrieveQueries = queryClient
		.getQueryCache()
		.findAll({ queryKey: ["pulse", "retrieve"] });
	for (const query of retrieveQueries) {
		const payload = parseRetrievePayload(query.queryKey);
		if (!payload) {
			continue;
		}

		queryClient.setQueryData<PulseRetrieveSocketResult>(
			query.queryKey,
			(oldResult) => ({
				message: oldResult?.message ?? "Pulses retrieved",
				data: upsertPulseForPayload(oldResult?.data, pulse, payload),
			}),
		);
	}
};
