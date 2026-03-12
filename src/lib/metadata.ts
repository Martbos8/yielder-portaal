import type { Metadata } from "next";

/**
 * Page metadata definitions for all portal routes.
 * Portal pages are noindex by default (behind authentication).
 */
const PAGE_META: Record<string, { title: string; description: string }> = {
  "/dashboard": {
    title: "Dashboard",
    description: "Overzicht van uw IT-omgeving met KPI's, aandachtspunten en recente activiteit.",
  },
  "/tickets": {
    title: "Tickets",
    description: "Beheer uw servicetickets — bekijk status, prioriteit en voortgang.",
  },
  "/hardware": {
    title: "Hardware",
    description: "Overzicht van al uw hardware — garantiestatus, levenscyclus en vervangingsadvies.",
  },
  "/software": {
    title: "Software",
    description: "Beheer uw softwarelicenties — status, verloopdatum en kosten.",
  },
  "/contracten": {
    title: "Contracten",
    description: "Bekijk uw actieve contracten, kosten en verloopdatums.",
  },
  "/supportcontracten": {
    title: "Support SLA",
    description: "Overzicht van uw support- en SLA-contracten.",
  },
  "/upgrade": {
    title: "Upgrade",
    description: "IT-score, aanbevelingen en verbetermogelijkheden voor uw omgeving.",
  },
  "/it-gezondheid": {
    title: "IT-gezondheid",
    description: "Gezondheidsscores en trends van uw IT-infrastructuur.",
  },
  "/prestaties": {
    title: "Prestaties",
    description: "Prestatiestatistieken van uw servicetickets en support.",
  },
  "/facturen": {
    title: "Facturen",
    description: "Bekijk en download uw facturen.",
  },
  "/documenten": {
    title: "Documenten",
    description: "Toegang tot uw IT-documentatie en handleidingen.",
  },
  "/contact": {
    title: "Contact",
    description: "Neem contact op met uw Yielder-team of dien een verzoek in.",
  },
  "/shop": {
    title: "IT-oplossingen",
    description: "Ontdek IT-oplossingen en diensten op maat van uw bedrijf.",
  },
  "/admin": {
    title: "Beheer",
    description: "Administratie en synchronisatiebeheer.",
  },
};

/** Build Next.js Metadata for a portal page. */
export function portalMetadata(route: string): Metadata {
  const meta = PAGE_META[route];
  const title = meta?.title ?? "Portaal";
  const description = meta?.description ?? "Mijn Yielder klantportaal.";
  return {
    title,
    description,
    robots: { index: false, follow: false },
    openGraph: {
      title: `${title} | Mijn Yielder`,
      description,
    },
  };
}
