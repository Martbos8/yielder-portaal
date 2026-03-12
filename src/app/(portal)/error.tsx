"use client";

import { MaterialIcon } from "@/components/icon";

type ErrorInfo = {
  icon: string;
  iconColor: string;
  bgColor: string;
  title: string;
  description: string;
};

function getErrorInfo(error: Error & { digest?: string }): ErrorInfo {
  const message = error.message.toLowerCase();

  // Auth errors
  if (message.includes("niet geautoriseerd") || message.includes("unauthorized")) {
    return {
      icon: "lock",
      iconColor: "text-amber-500",
      bgColor: "bg-amber-50",
      title: "Niet geautoriseerd",
      description: "U heeft geen toegang tot deze pagina. Log opnieuw in of neem contact op met uw beheerder.",
    };
  }

  // Not found errors
  if (message.includes("niet gevonden") || message.includes("not found")) {
    return {
      icon: "search_off",
      iconColor: "text-yielder-navy",
      bgColor: "bg-blue-50",
      title: "Niet gevonden",
      description: "De gevraagde informatie kon niet worden gevonden.",
    };
  }

  // Rate limit errors
  if (message.includes("te veel verzoeken") || message.includes("rate limit")) {
    return {
      icon: "speed",
      iconColor: "text-orange-500",
      bgColor: "bg-orange-50",
      title: "Te veel verzoeken",
      description: "U heeft te veel verzoeken gedaan. Wacht even en probeer het opnieuw.",
    };
  }

  // Default: unexpected error
  return {
    icon: "error_outline",
    iconColor: "text-red-400",
    bgColor: "bg-red-50",
    title: "Er ging iets mis",
    description: "Er is een onverwachte fout opgetreden. Probeer het opnieuw of neem contact op met Yielder IT als het probleem aanhoudt.",
  };
}

export default function PortalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const info = getErrorInfo(error);

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className={`w-20 h-20 rounded-full ${info.bgColor} flex items-center justify-center mb-5`}>
        <MaterialIcon name={info.icon} className={info.iconColor} size={40} />
      </div>
      <h2 className="text-lg font-semibold text-foreground mb-2">
        {info.title}
      </h2>
      <p className="text-sm text-muted-foreground mb-6 max-w-md">
        {info.description}
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
