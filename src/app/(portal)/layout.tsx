import { getUserProfile, getUserCompany, getOpenTicketCount } from "@/lib/queries";
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
  const [profile, company, openTicketCount] = await Promise.all([
    getUserProfile(),
    getUserCompany(),
    getOpenTicketCount(),
  ]);

  const fullName = profile?.full_name ?? "Gebruiker";
  const companyName = company?.name ?? "";
  const initials = getInitials(profile?.full_name ?? null);

  return (
    <PortalShell user={{ fullName, initials, companyName }} openTicketCount={openTicketCount}>
      {children}
    </PortalShell>
  );
}
