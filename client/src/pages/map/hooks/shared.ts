import { hono } from "@client/lib/api/client";
import {
	parseApiData,
	parseSocketData,
	parseValueWithSchema,
} from "@client/lib/api/parse";
import { clusterArraySchema } from "@client/utils/clusterTypes";
import {
	heroAlertNotificationPayloadSchema,
	pulseUpdatedNotificationPayloadSchema,
} from "@client/utils/notifications";
import { clientPulseSchema } from "@client/utils/types";
import { ResponseStatusEnum } from "@shared/types";
import type { PulseSocketMessageType } from "@shared/validators/pulses/isPulseSocketMessageValid";
import { z } from "zod";

const pulseNotificationSchema = z.object({
	type: z.string(),
	payload: z.union([
		heroAlertNotificationPayloadSchema,
		pulseUpdatedNotificationPayloadSchema,
	]),
});

export const pulseResponseMutationSchema = z.object({
	id: z.string(),
	pulseId: z.string(),
	responderId: z.string(),
	status: z.nativeEnum(ResponseStatusEnum),
	createdAt: z.string(),
});

export const sendPulseSocketMessage = <TSchema extends z.ZodTypeAny>(
	message: PulseSocketMessageType,
	schema: TSchema,
	fallbackMessage: string,
) => {
	return new Promise<{ message: string; data: z.infer<TSchema> }>(
		(resolve, reject) => {
			const socket = hono.api.pulse.$ws();

			const cleanup = () => {
				socket.removeEventListener("open", onOpen);
				socket.removeEventListener("message", onMessage);
				socket.removeEventListener("error", onError);
				socket.close();
			};

			const onOpen = () => {
				socket.send(JSON.stringify(message));
			};

			const onMessage = (event: MessageEvent) => {
				try {
					const raw = JSON.parse(event.data);
					const parsed = parseSocketData(raw, schema, fallbackMessage);
					cleanup();
					resolve(parsed);
				} catch (error) {
					cleanup();
					reject(error);
				}
			};

			const onError = () => {
				cleanup();
				reject(new Error("WebSocket error"));
			};

			socket.addEventListener("open", onOpen);
			socket.addEventListener("message", onMessage);
			socket.addEventListener("error", onError);
		},
	);
};

export const fetchPulseById = async (pulseId: string) => {
	const response = await hono.api.pulse[":id"].$get({
		param: { id: pulseId },
	});
	const parsed = await parseApiData(
		response,
		clientPulseSchema,
		"Failed to retrieve pulse",
	);

	return parsed.data;
};

export const fetchClusters = async (params: {
	lat: number;
	lng: number;
	radius: number;
}) => {
	const response = await hono.api.pulse.clusters.$get({
		query: {
			lat: params.lat.toString(),
			lng: params.lng.toString(),
			radius: params.radius.toString(),
		},
	});

	const parsed = await parseApiData(
		response,
		clusterArraySchema,
		"Failed to retrieve clusters",
	);

	return parsed.data;
};

export const parsePulseNotification = (payload: unknown) => {
	return parseValueWithSchema(
		payload,
		pulseNotificationSchema,
		"Failed to process pulse notification",
	);
};

export const parsePulseMutationResponse = async (
	response: Response,
	fallbackMessage: string,
) => {
	return parseApiData(response, pulseResponseMutationSchema, fallbackMessage);
};

export const pulseArraySchema = z.array(clientPulseSchema);
