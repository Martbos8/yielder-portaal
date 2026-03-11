import { getUserCompanyId } from "@/lib/repositories";
import { getRecommendations, type Recommendation } from "@/lib/engine/recommendation";
import { getBestPrice } from "@/lib/distributors";
import { MaterialIcon } from "@/components/icon";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ContactModal } from "@/components/contact-modal";

function computeItScore(recommendations: Recommendation[]): number {
  if (recommendations.length === 0) return 100;

  const criticalCount = recommendations.filter((r) => r.severity === "critical").length;
  const warningCount = recommendations.filter((r) => r.severity === "warning").length;
  const infoCount = recommendations.filter((r) => r.severity === null || r.severity === "info").length;

  // Deduct from 100: critical=-15, warning=-8, info=-3
  const deductions = criticalCount * 15 + warningCount * 8 + infoCount * 3;
  return Math.max(0, Math.min(100, 100 - deductions));
}

function getScoreColor(score: number): string {
  if (score < 50) return "text-red-500";
  if (score < 80) return "text-yielder-orange";
  return "text-emerald-500";
}

function getScoreRingColor(score: number): string {
  if (score < 50) return "stroke-red-500";
  if (score < 80) return "stroke-yielder-orange";
  return "stroke-emerald-500";
}

function getSeverityBadge(severity: string | null) {
  switch (severity) {
    case "critical":
      return <Badge className="bg-red-100 text-red-700 border-red-200">Kritiek</Badge>;
    case "warning":
      return <Badge className="bg-orange-100 text-orange-700 border-orange-200">Aanbevolen</Badge>;
    case "info":
      return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Suggestie</Badge>;
    default:
      return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Suggestie</Badge>;
  }
}

const formatPrice = new Intl.NumberFormat("nl-NL", {
  style: "currency",
  currency: "EUR",
});

async function getRecommendationPrices(
  recommendations: Recommendation[]
): Promise<Map<string, number>> {
  const priceMap = new Map<string, number>();

  const pricePromises = recommendations
    .filter((r) => r.product.sku)
    .map(async (r) => {
      const best = await getBestPrice(r.product.sku!);
      if (best) {
        priceMap.set(r.product.id, best.price);
      }
    });

  await Promise.all(pricePromises);
  return priceMap;
}

export default async function UpgradePage() {
  const companyId = await getUserCompanyId();

  if (!companyId) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <MaterialIcon name="lock" size={48} className="mx-auto mb-4 opacity-40" />
        <p>Geen bedrijf gekoppeld aan uw account.</p>
      </div>
    );
  }

  const recommendations = await getRecommendations(companyId);
  const prices = await getRecommendationPrices(recommendations);
  const itScore = computeItScore(recommendations);

  const criticalItems = recommendations.filter((r) => r.severity === "critical");
  const otherItems = recommendations.filter((r) => r.severity !== "critical");

  // Segment stats
  const totalRecs = recommendations.length;
  const criticalCount = criticalItems.length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-yielder-navy">Upgrade advies</h1>
        <p className="text-muted-foreground mt-1">
          Persoonlijke aanbevelingen op basis van uw IT-omgeving
        </p>
      </div>

      {/* IT Score + Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* IT Score Card */}
        <Card className="rounded-2xl p-6 shadow-card border flex flex-col items-center justify-center">
          <p className="text-sm font-medium text-muted-foreground mb-4">Uw IT-score</p>
          <div className="relative size-32">
            <svg className="size-32 -rotate-90" viewBox="0 0 128 128">
              <circle
                cx="64"
                cy="64"
                r="56"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                className="text-muted/20"
              />
              <circle
                cx="64"
                cy="64"
                r="56"
                fill="none"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${(itScore / 100) * 351.86} 351.86`}
                className={getScoreRingColor(itScore)}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-3xl font-bold ${getScoreColor(itScore)}`}>
                {itScore}%
              </span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-4 text-center">
            {itScore >= 80
              ? "Uw IT-omgeving is goed op orde"
              : itScore >= 50
                ? "Er zijn verbeteringen mogelijk"
                : "Directe aandacht vereist"}
          </p>
        </Card>

        {/* Stats Cards */}
        <Card className="rounded-2xl p-6 shadow-card border">
          <p className="text-sm font-medium text-muted-foreground mb-3">Overzicht</p>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground">Totaal aanbevelingen</span>
              <span className="text-lg font-bold text-yielder-navy">{totalRecs}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground">Kritieke acties</span>
              <span className={`text-lg font-bold ${criticalCount > 0 ? "text-red-500" : "text-emerald-500"}`}>
                {criticalCount}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground">Overige suggesties</span>
              <span className="text-lg font-bold text-yielder-navy">
                {totalRecs - criticalCount}
              </span>
            </div>
          </div>
        </Card>

        {/* Segment Info */}
        <Card className="rounded-2xl p-6 shadow-card border">
          <p className="text-sm font-medium text-muted-foreground mb-3">Klanten zoals u</p>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <MaterialIcon name="groups" className="text-yielder-navy/70 mt-0.5" size={20} />
              <p className="text-sm text-foreground">
                Uw aanbevelingen zijn gebaseerd op vergelijkbare bedrijven in dezelfde branche en grootteklasse.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <MaterialIcon name="trending_up" className="text-yielder-navy/70 mt-0.5" size={20} />
              <p className="text-sm text-foreground">
                Het algoritme leert continu van feedback en wordt steeds nauwkeuriger.
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Critical Actions */}
      {criticalItems.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <MaterialIcon name="error" className="text-red-500" />
            <h2 className="text-lg font-semibold text-red-700">Direct actie vereist</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {criticalItems.map((rec) => (
              <RecommendationCard key={rec.product.id} rec={rec} price={prices.get(rec.product.id)} companyId={companyId} />
            ))}
          </div>
        </section>
      )}

      {/* Other Recommendations */}
      {otherItems.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <MaterialIcon name="lightbulb" className="text-yielder-orange" />
            <h2 className="text-lg font-semibold text-yielder-navy">Aanbevelingen</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {otherItems.map((rec) => (
              <RecommendationCard key={rec.product.id} rec={rec} price={prices.get(rec.product.id)} companyId={companyId} />
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {recommendations.length === 0 && (
        <Card className="rounded-2xl p-12 shadow-card border text-center">
          <div className="size-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
            <MaterialIcon name="check_circle" className="text-emerald-500" size={32} />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-1">Alles up-to-date</h3>
          <p className="text-sm text-muted-foreground">
            Uw IT-omgeving is compleet. Er zijn op dit moment geen aanbevelingen.
          </p>
        </Card>
      )}
    </div>
  );
}

function RecommendationCard({
  rec,
  price,
  companyId,
}: {
  rec: Recommendation;
  price?: number | undefined;
  companyId: string;
}) {
  const isCritical = rec.severity === "critical";

  return (
    <Card
      className={`rounded-2xl p-5 shadow-card border transition-shadow hover:shadow-card-hover ${
        isCritical ? "border-red-200 bg-red-50/30" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">{rec.category}</span>
          {getSeverityBadge(rec.severity)}
        </div>
        {price != null && (
          <span className="text-sm font-medium text-yielder-navy whitespace-nowrap">
            vanaf {formatPrice.format(price)}
          </span>
        )}
      </div>

      <h3 className="font-semibold text-foreground mb-1">{rec.product.name}</h3>
      {rec.product.vendor && (
        <p className="text-xs text-muted-foreground mb-2">{rec.product.vendor}</p>
      )}

      <p className="text-sm text-muted-foreground mb-3">{rec.reason}</p>

      {rec.adoptionRate != null && (
        <div className="flex items-center gap-1.5 mb-3">
          <MaterialIcon name="groups" size={16} className="text-yielder-navy/50" />
          <span className="text-xs text-muted-foreground">
            {Math.round(rec.adoptionRate * 100)}% van vergelijkbare bedrijven
          </span>
        </div>
      )}

      <ContactModal
        productName={rec.product.name}
        productId={rec.product.id}
        companyId={companyId}
        defaultUrgency={isCritical ? "hoog" : "normaal"}
        trigger={
          <button
            className={`w-full py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
              isCritical
                ? "bg-red-600 text-white hover:bg-red-700"
                : "bg-yielder-navy text-white hover:bg-yielder-navy/90"
            }`}
          >
            {rec.ctaText}
          </button>
        }
      />
    </Card>
  );
}
