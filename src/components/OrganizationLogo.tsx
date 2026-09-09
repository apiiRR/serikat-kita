import { useState } from "react";
import { Users } from "lucide-react";
import { useOrganizationLogo } from "@/hooks/useOrganizationLogo";
import { logoUrl } from "@/lib/organization-logo";
import { cn } from "@/lib/utils";
export default function OrganizationLogo({
  className,
}: {
  className?: string;
}) {
  const { data: path } = useOrganizationLogo();
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const url = path ? logoUrl(path) : null;
  if (!url || failedUrl === url)
    return (
      <Users
        aria-label="Serikat Pekerja PT Berdikari"
        className={cn("shrink-0 text-secondary", className)}
      />
    );
  return (
    <img
      src={url}
      alt="Logo Serikat Pekerja PT Berdikari"
      className={cn("shrink-0 object-contain", className)}
      onError={() => setFailedUrl(url)}
    />
  );
}
