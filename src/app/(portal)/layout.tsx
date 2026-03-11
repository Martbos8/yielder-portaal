import { getUserProfile, getUserCompany, getUserCompanyId, getOpenTicketCount } from "@/lib/queries";
import { getRecommendations } from "@/lib/engine/recommendation";
import { PortalShell } from "@/components/portal-shell";

function getInitials(name: string | null): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [profile, company, openTicketCount, companyId] = await Promise.all([
    getUserProfile(),
    getUserCompany(),
    getOpenTicketCount(),
    getUserCompanyId(),
  ]);

  let criticalUpgradeCount = 0;
  if (companyId) {
    try {
      const recs = await getRecommendations(companyId);
      criticalUpgradeCount = recs.filter((r) => r.severity === "critical").length;
    } catch {
      // Silently fail — tables may not exist yet
    }
  }

  const fullName = profile?.full_name ?? "Gebruiker";
  const companyName = company?.name ?? "";
  const initials = getInitials(profile?.full_name ?? null);

  return (
    <PortalShell user={{ fullName, initials, companyName }} openTicketCount={openTicketCount} criticalUpgradeCount={criticalUpgradeCount}>
      {children}
    </PortalShell>
  );
}
