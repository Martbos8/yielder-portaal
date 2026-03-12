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
          Factuuroverzicht wordt binnenkort beschikbaar
        </h2>
        <p className="text-sm text-muted-foreground max-w-md">
          We werken aan de koppeling met ons facturatiesysteem. Zodra deze
          gereed is, vindt u hier een overzicht van al uw facturen.
        </p>
      </div>
    </div>
  );
}
