import { useQuery } from "@tanstack/react-query";
import {
  fetchOrganizationLogo,
  organizationLogoKey,
} from "@/lib/organization-logo";
export function useOrganizationLogo() {
  return useQuery({
    queryKey: organizationLogoKey,
    queryFn: fetchOrganizationLogo,
    staleTime: 60000,
    retry: false,
  });
}
