import Link from "next/link";
import { MaterialIcon } from "@/components/icon";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-center px-4">
      <div className="w-20 h-20 rounded-full bg-yielder-navy/5 flex items-center justify-center mb-5">
        <MaterialIcon
          name="search_off"
          className="text-yielder-navy/40"
          size={40}
        />
      </div>
      <h1 className="text-2xl font-semibold text-foreground mb-2">
        Pagina niet gevonden
      </h1>
      <p className="text-sm text-muted-foreground mb-6 max-w-md">
        De pagina die u zoekt bestaat niet of is verplaatst.
      </p>
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-yielder-navy text-white text-sm font-medium hover:bg-yielder-navy/90 transition-colors"
      >
        <MaterialIcon name="arrow_back" size={18} />
        Terug naar dashboard
      </Link>
    </div>
  );
}
