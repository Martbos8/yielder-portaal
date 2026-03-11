/** Revalidate hardware data every 5 minutes. */
export const revalidate = 300;

import { getHardwareAssets } from "@/lib/repositories";
import { HardwareClient } from "./hardware-client";

export default async function HardwarePage() {
  const assets = await getHardwareAssets();

  return (
    <div>
      <h1 className="section-title text-2xl mb-6">Hardware</h1>
      <HardwareClient assets={assets} />
    </div>
  );
}
