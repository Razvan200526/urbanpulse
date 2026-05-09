import { hono, queryClient } from "@client/lib/api/client";
import { parseApiData } from "@client/lib/api/parse";
import {
	type ClientIncidentType,
	clientIncidentTypeSchema,
} from "@client/utils/types";
import { Toast } from "@heroui/react";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { InferRequestType } from "hono/client";
import { z } from "zod";

const incidentTypeListSchema = z.array(clientIncidentTypeSchema);
const publicIncidentTypesRoute = hono.api["incident-types"];
const adminIncidentTypesRoute = hono.api.admin["incident-types"];
const adminIncidentTypeByIdRoute = hono.api.admin["incident-types"][":id"];

type CreateIncidentTypeInput = InferRequestType<
	typeof adminIncidentTypesRoute.$post
>["json"];

type UpdateIncidentTypeInput = InferRequestType<
	typeof adminIncidentTypeByIdRoute.$patch
>;

const fetchActiveIncidentTypes = async () => {
	const response = await publicIncidentTypesRoute.$get();
	const parsed = await parseApiData(
		response,
		incidentTypeListSchema,
		"Failed to load incident types",
	);

	return parsed.data;
};

const fetchAdminIncidentTypes = async () => {
	const response = await adminIncidentTypesRoute.$get();
	const parsed = await parseApiData(
		response,
		incidentTypeListSchema,
		"Failed to load incident types",
	);

	return parsed.data;
};

const invalidateIncidentTypeQueries = () => {
	queryClient.invalidateQueries({ queryKey: ["incident-types"] });
	queryClient.invalidateQueries({ queryKey: ["admin", "incident-types"] });
	queryClient.invalidateQueries({ queryKey: ["admin", "overview"] });
	queryClient.invalidateQueries({ queryKey: ["admin", "reports"] });
	queryClient.invalidateQueries({ queryKey: ["pulse", "retrieve"] });
};

export const useIncidentTypes = () => {
	return useQuery({
		queryKey: ["incident-types", "active"],
		queryFn: fetchActiveIncidentTypes,
		staleTime: 5 * 60 * 1000,
	});
};

export const useAdminIncidentTypes = () => {
	return useQuery({
		queryKey: ["admin", "incident-types"],
		queryFn: fetchAdminIncidentTypes,
		retry: false,
	});
};

export const useCreateIncidentType = () => {
	return useMutation({
		mutationKey: ["admin", "incident-types", "create"],
		mutationFn: async (payload: CreateIncidentTypeInput) => {
			const response = await adminIncidentTypesRoute.$post({ json: payload });
			const parsed = await parseApiData(
				response,
				clientIncidentTypeSchema,
				"Failed to create incident type",
			);

			Toast.toast.success("Incident type created");
			return parsed.data;
		},
		onSuccess: invalidateIncidentTypeQueries,
	});
};

export const useUpdateIncidentType = () => {
	return useMutation({
		mutationKey: ["admin", "incident-types", "update"],
		mutationFn: async ({ param, json }: UpdateIncidentTypeInput) => {
			const response = await adminIncidentTypeByIdRoute.$patch({
				param,
				json,
			});
			const parsed = await parseApiData(
				response,
				clientIncidentTypeSchema,
				"Failed to update incident type",
			);

			Toast.toast.success("Incident type updated");
			return parsed.data;
		},
		onSuccess: invalidateIncidentTypeQueries,
	});
};

export type { ClientIncidentType };
