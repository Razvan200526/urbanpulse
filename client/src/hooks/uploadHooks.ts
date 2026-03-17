import { hono } from "@client/main";
import { useMutation } from "@tanstack/react-query";

export const useUploadAvatar = () => {
	return useMutation({
		mutationKey: ["avatar", "upload"],
		mutationFn: async (file: File) => {
			return await hono.api.avatar.upload.$post({ form: { file } });
		},
	});
};

export const useUploadImage = () => {
	return useMutation({
		mutationKey: ["image", "upload"],
		mutationFn: async (file: File) => {
			return await hono.api.avatar.upload.image.$post({ form: { file } });
		},
	});
};
