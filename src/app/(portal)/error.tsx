"use client";

import { MaterialIcon } from "@/components/icon";

export default function PortalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mb-5">
        <MaterialIcon name="error_outline" className="text-red-400" size={40} />
      </div>
      <h2 className="text-lg font-semibold text-foreground mb-2">
        Er ging iets mis
      </h2>
      <p className="text-sm text-muted-foreground mb-6 max-w-md">
        Er is een onverwachte fout opgetreden. Probeer het opnieuw of neem
        contact op met Yielder IT als het probleem aanhoudt.
      </p>
      <button
        onClick={reset}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-yielder-navy text-white text-sm font-medium hover:bg-yielder-navy/90 transition-colors"
      >
        <MaterialIcon name="refresh" size={18} />
        Probeer opnieuw
      </button>
    </div>
  );
}
