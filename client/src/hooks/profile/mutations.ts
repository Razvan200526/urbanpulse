import { authClient, hono, queryClient } from "@client/lib/api/client";
import { parseApiData, parseApiEnvelope } from "@client/lib/api/parse";
import { clientUserSchema } from "@client/utils/types";
import { useMutation } from "@tanstack/react-query";
import type { InferRequestType } from "hono/client";
import { z } from "zod";
import { alertPreferencesSchema, quietHoursSchema } from "./schemas";

const quietHoursEndpoint = hono.api.users["quiet-hours"];
const alertPreferencesEndpoint = hono.api.users["alert-preferences"];

type UpdateUserProfileInput = InferRequestType<
	typeof hono.api.users.profile.$patch
>["json"];

type UpdateSkillTagsInput = InferRequestType<
	typeof hono.api.users.skills.$put
>["json"];

type UpdateQuietHoursInput = InferRequestType<
	typeof quietHoursEndpoint.$put
>["json"];

type UpdateAlertPreferencesInput = InferRequestType<
	typeof alertPreferencesEndpoint.$put
>["json"];

const updateUserProfile = async (payload: UpdateUserProfileInput) => {
	const response = await hono.api.users.profile.$patch({
		json: payload,
	});
	const parsed = await parseApiData(
		response,
		clientUserSchema,
		"Failed to update profile",
	);

	return parsed.data;
};

const updateSkillTags = async ({ tags }: UpdateSkillTagsInput) => {
	const response = await hono.api.users.skills.$put({
		json: { tags },
	});
	const parsed = await parseApiData(
		response,
		z.object({ tags: z.array(z.string()) }),
		"Failed to update skill tags",
	);

	return parsed.data.tags;
};

const updateQuietHours = async (payload: UpdateQuietHoursInput) => {
	const response = await quietHoursEndpoint.$put({
		json: payload,
	});
	const parsed = await parseApiData(
		response,
		quietHoursSchema,
		"Failed to save quiet hours",
	);

	return parsed.data;
};

const updateAlertPreferences = async (payload: UpdateAlertPreferencesInput) => {
	const response = await alertPreferencesEndpoint.$put({
		json: payload,
	});
	const parsed = await parseApiData(
		response,
		alertPreferencesSchema,
		"Failed to save alert preferences",
	);

	return parsed.data;
};

const deleteAccount = async () => {
	const response = await hono.api.users.account.$delete();

	return parseApiEnvelope(response, z.null(), "Failed to delete account");
};

export const useUpdateUserProfile = () => {
	return useMutation({
		mutationKey: ["user", "profile", "update"],
		mutationFn: updateUserProfile,
		onSuccess: async () => {
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: ["user", "profile"] }),
				queryClient.invalidateQueries({ queryKey: ["auth"] }),
			]);
		},
	});
};

export const useUpdateSkillTags = () => {
	return useMutation({
		mutationKey: ["user", "skills", "update"],
		mutationFn: updateSkillTags,
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ["user", "profile"] });
		},
	});
};

export const useUpdateQuietHours = () => {
	return useMutation({
		mutationKey: ["user", "quiet-hours", "update"],
		mutationFn: updateQuietHours,
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ["user", "profile"] });
		},
	});
};

export const useUpdateAlertPreferences = () => {
	return useMutation({
		mutationKey: ["user", "alert-preferences", "update"],
		mutationFn: updateAlertPreferences,
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ["user", "profile"] });
		},
	});
};

export const useDeleteAccount = () => {
	return useMutation({
		mutationKey: ["user", "account", "delete"],
		mutationFn: deleteAccount,
		onSuccess: async () => {
			await authClient.signOut();
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: ["auth"] }),
				queryClient.invalidateQueries({ queryKey: ["user", "profile"] }),
			]);
		},
	});
};
