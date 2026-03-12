import { portalMetadata } from "@/lib/metadata";

export const metadata = portalMetadata("/contracten");

/** Revalidate contract data every 5 minutes. */
export const revalidate = 300;

import { getAgreements } from "@/lib/repositories";
import {
  countExpiringSoon,
  isMissingManagedCoverage,
  isManagedService,
} from "@/lib/contract-utils";
import type { Agreement } from "@/types/database";
import { ContractenClient } from "./contracten-client";

function getUncoveredAgreements(agreements: Agreement[]): Agreement[] {
  const active = agreements.filter((a) => a.status === "active");
  const hasManagedService = active.some((a) => isManagedService(a));
  if (hasManagedService) return [];
  return active.filter((a) => !isManagedService(a));
}

export default async function ContractenPage() {
  const agreements = await getAgreements();
  const expiringCount = countExpiringSoon(agreements);
  const missingManagedCoverage = isMissingManagedCoverage(agreements);
  const uncoveredAgreements = getUncoveredAgreements(agreements);

  return (
    <ContractenClient
      agreements={agreements}
      expiringCount={expiringCount}
      missingManagedCoverage={missingManagedCoverage}
      uncoveredAgreements={uncoveredAgreements}
    />
  );
}
