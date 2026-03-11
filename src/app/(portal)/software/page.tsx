import { Suspense } from "react";
import { getLicenses } from "@/lib/repositories";
import { LicenseFilters } from "./license-filters";

async function SoftwareContent() {
  const licenses = await getLicenses();
  return <LicenseFilters licenses={licenses} />;
}

export default function SoftwarePage() {
  return (
    <div>
      <h1 className="section-title text-2xl mb-6">Software &amp; Licenties</h1>
      <Suspense>
        <SoftwareContent />
      </Suspense>
    </div>
  );
}
