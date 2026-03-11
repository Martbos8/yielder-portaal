import { getUserProfile, getUserCompany, getUserCompanyId, getOpenTicketCount, getNotifications } from "@/lib/queries";
import { getRecommendations } from "@/lib/engine/recommendation";
import { PortalShell } from "@/components/portal-shell";

function getInitials(name: string | null): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "?";
  const first = parts[0];
  if (!first) return "?";
  if (parts.length === 1) return first[0]?.toUpperCase() ?? "?";
  const last = parts[parts.length - 1];
  const firstChar = first[0] ?? "";
  const lastChar = last?.[0] ?? "";
  return (firstChar + lastChar).toUpperCase();
}

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [profile, company, openTicketCount, companyId, notifications] = await Promise.all([
    getUserProfile(),
    getUserCompany(),
    getOpenTicketCount(),
    getUserCompanyId(),
    getNotifications(),
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
    <PortalShell user={{ fullName, initials, companyName }} openTicketCount={openTicketCount} criticalUpgradeCount={criticalUpgradeCount} notifications={notifications}>
      {children}
    </PortalShell>
  );
}
