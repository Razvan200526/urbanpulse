import { authClient } from "@client/main";
import { useQuery } from "@tanstack/react-query";

export const useAuth = () => {
	return useQuery({
		queryKey: ["auth"],
		queryFn: async () => {
			const { data } = await authClient.getSession();
			return data;
		},
		retry: true,
	});
};
