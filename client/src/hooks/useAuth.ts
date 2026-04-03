import { authClient } from "@client/main";
import { useQuery } from "@tanstack/react-query";

export const authQueryKey = ["auth"] as const;

export const fetchAuthSession = async () => {
  const { data } = await authClient.getSession();
  return data;
};

export const useAuth = () => {
  return useQuery({
    queryKey: authQueryKey,
    queryFn: fetchAuthSession,
    staleTime: 50_000,
    retry: false,
  });
};
