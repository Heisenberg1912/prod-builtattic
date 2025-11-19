import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { fetchUsageSummary, creditUsage } from "../api";

const usageQueryKey = ["vitruvi", "usage"];

export function useVitruviUsage() {
  const queryClient = useQueryClient();

  const updateUsageCache = (nextUsage) => {
    if (nextUsage) {
      queryClient.setQueryData(usageQueryKey, nextUsage);
    }
  };

  const usageQuery = useQuery({
    queryKey: usageQueryKey,
    queryFn: fetchUsageSummary,
    staleTime: 1000 * 60,
    refetchOnWindowFocus: false,
  });

  const creditMutation = useMutation({
    mutationKey: [...usageQueryKey, "credit"],
    mutationFn: (payload) => creditUsage(payload),
    onSuccess: (data) => {
      if (data) {
        updateUsageCache(data);
      }
    },
  });

  return { usageQuery, creditMutation, updateUsageCache };
}

export default useVitruviUsage;
