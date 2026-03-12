import { portalMetadata } from "@/lib/metadata";

export const metadata = portalMetadata("/facturen");

import { MaterialIcon } from "@/components/icon";

export default function FacturenPage() {
  return (
    <div>
      <h1 className="section-title text-2xl mb-6">Facturen</h1>
      <div className="bg-card rounded-2xl p-12 shadow-card border border-border flex flex-col items-center justify-center text-center">
        <div className="w-20 h-20 rounded-full bg-yielder-navy/5 flex items-center justify-center mb-5">
          <MaterialIcon
            name="receipt_long"
            className="text-yielder-navy/40"
            size={40}
          />
        </div>
        <h2 className="text-lg font-semibold text-foreground mb-2">
          Facturen
        </h2>
        <p className="text-sm text-muted-foreground max-w-md mb-4">
          De facturenmodule wordt momenteel voorbereid. Zodra de koppeling met
          ons facturatiesysteem gereed is, vindt u hier een volledig overzicht
          van al uw facturen en betalingen.
        </p>
        <div className="inline-flex items-center gap-2 text-xs text-yielder-navy/60 bg-yielder-navy/[0.04] px-3 py-1.5 rounded-full">
          <MaterialIcon name="info" size={14} />
          <span>Neem contact op met uw accountmanager voor factuurgerelateerde vragen</span>
        </div>
      </div>
    </div>
  );
}
