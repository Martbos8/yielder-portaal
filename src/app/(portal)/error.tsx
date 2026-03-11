"use client";

import { MaterialIcon } from "@/components/icon";

export default function PortalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="bg-card rounded-2xl p-10 shadow-card border border-border flex flex-col items-center text-center max-w-md w-full">
        <div className="size-16 rounded-2xl bg-yielder-orange/10 flex items-center justify-center mb-5">
          <MaterialIcon
            name="error_outline"
            className="text-yielder-orange"
            size={32}
          />
        </div>
        <h2 className="text-lg font-semibold text-foreground mb-2">
          Er ging iets mis
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          Er is een onverwachte fout opgetreden. Probeer het opnieuw of neem
          contact op met Yielder IT als het probleem aanhoudt.
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-yielder-navy text-white text-sm font-medium hover:bg-yielder-navy/90 transition-colors"
          >
            <MaterialIcon name="refresh" size={18} />
            Probeer opnieuw
          </button>
          <a
            href="/contact"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-yielder-navy/[0.06] text-yielder-navy text-sm font-medium hover:bg-yielder-navy/10 transition-colors"
          >
            <MaterialIcon name="support_agent" size={18} />
            Contact
          </a>
        </div>
      </div>
    </div>
  );
}
