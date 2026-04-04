import { authClient, hono, queryClient } from "@client/main";
import type { ClientUserType } from "@client/utils/types";
import type { AlertPreferences, GeoPoint } from "@shared/types";
import { useMutation, useQuery } from "@tanstack/react-query";

export type Weekday = "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";

export type QuietHoursForm = {
	id: string;
	startTime: string;
	endTime: string;
	days: Weekday[];
};

export type UserProfilePayload = {
	user: ClientUserType;
	quietHours: QuietHoursForm | null;
	skillTags: string[];
	alertPreferences: AlertPreferences;
};

type SuccessResponse<T> = {
	success: boolean;
	message: string;
	data: T;
};

export const useUserProfile = () => {
	return useQuery({
		queryKey: ["user", "profile"],
		queryFn: async () => {
			const res = await hono.api.users.profile.$get();
			const json =
				(await res.json()) as SuccessResponse<UserProfilePayload | null>;
			if (!json.success || !json.data) {
				throw new Error(json.message || "Failed to load profile");
			}
			return json.data;
		},
	});
};

export const useUpdateUserProfile = () => {
	return useMutation({
		mutationKey: ["user", "profile", "update"],
		mutationFn: async (payload: {
			name: string;
			bio: string;
			image: string | null;
		}) => {
			const res = await hono.api.users.profile.$patch({
				json: payload,
			});
			const json = (await res.json()) as SuccessResponse<ClientUserType | null>;
			if (!json.success || !json.data) {
				throw new Error(json.message || "Failed to update profile");
			}
			return json.data;
		},
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
		mutationFn: async (tags: string[]) => {
			const res = await hono.api.users.skills.$put({
				json: { tags },
			});
			const json = (await res.json()) as SuccessResponse<{
				tags: string[];
			} | null>;
			if (!json.success || !json.data) {
				throw new Error(json.message || "Failed to update skill tags");
			}
			return json.data.tags;
		},
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ["user", "profile"] });
		},
	});
};

export const useUpdateQuietHours = () => {
	return useMutation({
		mutationKey: ["user", "quiet-hours", "update"],
		mutationFn: async (payload: {
			startTime: string;
			endTime: string;
			days: Weekday[];
		}) => {
			const res = await hono.api.users["quiet-hours"].$put({
				json: payload,
			});
			const json = (await res.json()) as SuccessResponse<QuietHoursForm | null>;
			if (!json.success || !json.data) {
				throw new Error(json.message || "Failed to save quiet hours");
			}
			return json.data;
		},
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ["user", "profile"] });
		},
	});
};

export const useUpdateAlertPreferences = () => {
	return useMutation({
		mutationKey: ["user", "alert-preferences", "update"],
		mutationFn: async (payload: {
			homeLocation: GeoPoint | null;
			heroAlertRadiusMeters: number;
		}) => {
			const res = await hono.api.users["alert-preferences"].$put({
				json: payload,
			});
			const json =
				(await res.json()) as SuccessResponse<AlertPreferences | null>;
			if (!json.success || !json.data) {
				throw new Error(json.message || "Failed to save alert preferences");
			}
			return json.data;
		},
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ["user", "profile"] });
		},
	});
};

export const useDeleteAccount = () => {
	return useMutation({
		mutationKey: ["user", "account", "delete"],
		mutationFn: async () => {
			const res = await hono.api.users.account.$delete();
			const json = (await res.json()) as SuccessResponse<null>;
			if (!json.success) {
				throw new Error(json.message || "Failed to delete account");
			}
			return json;
		},
		onSuccess: async () => {
			await authClient.signOut();
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: ["auth"] }),
				queryClient.invalidateQueries({ queryKey: ["user", "profile"] }),
			]);
		},
	});
};
