import { hono } from "@client/main";
import { useMutation } from "@tanstack/react-query";

export const useUploadAvatar = () => {
	return useMutation({
		mutationKey: ["avatar", "upload"],
		mutationFn: async (file: File) => {
			const res = await hono.api.avatar.upload.$post({ form: { file } });
			return await res.json();
		},
	});
};

export const useUploadImage = () => {
	return useMutation({
		mutationKey: ["image", "upload"],
		mutationFn: async (file: File) => {
			const res = await hono.api.avatar.upload.image.$post({ form: { file } });
			return await res.json();
		},
	});
};

export const useUploadAudio = () => {
	return useMutation({
		mutationKey: ["audio", "upload"],
		mutationFn: async (file: File) => {
			const res = await hono.api.upload.audio.$post({ form: { file } });
			return await res.json();
		},
	});
};
