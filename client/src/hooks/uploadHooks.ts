import { hono } from "@client/lib/api/client";
import { useMutation } from "@tanstack/react-query";

export const useUploadAvatar = () => {
	return useMutation({
		mutationKey: ["avatar", "upload"],
		mutationFn: async (file: File) => {
			const res = await hono.api.avatar.$post({
				form: { file, type: "avatar" },
			});
			return await res.json();
		},
	});
};

export const useUploadImage = () => {
	return useMutation({
		mutationKey: ["image", "upload"],
		mutationFn: async (file: File) => {
			const res = await hono.api.avatar.$post({
				form: { file, type: "image" },
			});
			return await res.json();
		},
	});
};

export const useUploadAudio = () => {
	return useMutation({
		mutationKey: ["audio", "upload"],
		mutationFn: async (file: File) => {
			const res = await hono.api.avatar.$post({
				form: { file, type: "audio" },
			});
			return await res.json();
		},
	});
};
