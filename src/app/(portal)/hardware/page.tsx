/** Revalidate hardware data every 5 minutes. */
export const revalidate = 300;

import { getHardwareAssets } from "@/lib/repositories";
import { countAssetsNeedingUpgrade } from "@/lib/hardware-utils";
import { HardwareClient } from "@/components/hardware-client";

export default async function HardwarePage() {
  const assets = await getHardwareAssets();
  const upgradeCount = countAssetsNeedingUpgrade(assets);

  return <HardwareClient assets={assets} upgradeCount={upgradeCount} />;
}
