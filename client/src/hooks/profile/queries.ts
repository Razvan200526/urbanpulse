import { hono } from "@client/lib/api/client";
import { parseApiData } from "@client/lib/api/parse";
import { useQuery } from "@tanstack/react-query";
import { userProfilePayloadSchema } from "./schemas";

const fetchUserProfile = async () => {
	const response = await hono.api.users.profile.$get();
	const parsed = await parseApiData(
		response,
		userProfilePayloadSchema,
		"Failed to load profile",
	);

	return parsed.data;
};

export const useUserProfile = () => {
	return useQuery({
		queryKey: ["user", "profile"],
		queryFn: fetchUserProfile,
	});
};
