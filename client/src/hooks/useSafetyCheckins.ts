import { hono, queryClient } from "@client/lib/api/client";
import { parseApiData } from "@client/lib/api/parse";
import { Toast } from "@heroui/react";
import { SafetyCheckinStatusEnum } from "@shared/types";
import { useMutation, useQuery } from "@tanstack/react-query";
import { z } from "zod";

const safetyCheckinSchema = z.object({
	id: z.string(),
	userId: z.string(),
	userName: z.string(),
	userImage: z.string().nullable(),
	status: z.nativeEnum(SafetyCheckinStatusEnum),
	lat: z.coerce.number(),
	lng: z.coerce.number(),
	updatedAt: z.string(),
	expiresAt: z.string(),
	isMe: z.boolean(),
});

const safetyCheckinUpsertResultSchema = z.object({
	id: z.string(),
	userId: z.string(),
	status: z.nativeEnum(SafetyCheckinStatusEnum),
	lat: z.coerce.number(),
	lng: z.coerce.number(),
	updatedAt: z.string(),
	expiresAt: z.string(),
});

const safetyCheckinListSchema = z.object({
	checkins: z.array(safetyCheckinSchema),
	mine: safetyCheckinSchema.nullable(),
});

type NearbyParams = {
	lat: number;
	lng: number;
	radius: number;
};

export const useNearbySafetyCheckins = (
	params: NearbyParams,
	enabled = true,
) => {
	return useQuery({
		queryKey: ["safety", "check-ins", params],
		enabled,
		queryFn: async () => {
			const response = await hono.api.safety["check-ins"].$get({
				query: {
					lat: params.lat.toString(),
					lng: params.lng.toString(),
					radius: params.radius.toString(),
				},
			});

			const parsed = await parseApiData(
				response,
				safetyCheckinListSchema,
				"Failed to retrieve safety check-ins",
			);

			return parsed.data;
		},
		refetchInterval: enabled ? 15000 : false,
		refetchIntervalInBackground: true,
	});
};

export const useUpsertSafetyCheckin = () => {
	return useMutation({
		mutationKey: ["safety", "check-in", "upsert"],
		mutationFn: async (payload: {
			status: SafetyCheckinStatusEnum;
			lat: number;
			lng: number;
		}) => {
			const response = await hono.api.safety["check-in"].$post({
				json: payload,
			});

			const parsed = await parseApiData(
				response,
				safetyCheckinUpsertResultSchema,
				"Failed to update safety status",
			);

			return parsed.data;
		},
		onSuccess: () => {
			Toast.toast.success("Safety status updated");
			queryClient.invalidateQueries({ queryKey: ["safety", "check-ins"] });
		},
	});
};

export type SafetyCheckinView = z.infer<typeof safetyCheckinSchema>;
