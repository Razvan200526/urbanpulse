import { hono } from "@client/main";
import { Toast } from "@heroui/react";
import { useMutation, useQuery } from "@tanstack/react-query";

export const useUploadResource = (userId: string) => {
	return useMutation({
		mutationKey: ["upload", "resource", userId],
		mutationFn: async (resource: {
			userId: string;
			availability: string;
			name: string;
			description: string;
		}) => {
			const response = await hono.api.resources.$post({ json: resource });
			const res = await response.json();
			if (!res.success || !res.data) {
				Toast.toast.danger(res.message);
				return;
			}
			return res;
		},
	});
};

export const useRetrieveResources = (userId: string) => {
	return useQuery({
		queryKey: ["retrieve", "resources", userId],
		queryFn: async () => {
			const response = await hono.api.resources.$get({
				query: {
					userId,
				},
			});
			const res = await response.json();
			if (!res.success || !res.data) {
				Toast.toast.danger(res.message);
				return;
			}
			return res.data;
		},
	});
};
