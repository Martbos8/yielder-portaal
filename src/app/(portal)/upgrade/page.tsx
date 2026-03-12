import { portalMetadata } from "@/lib/metadata";

export const metadata = portalMetadata("/upgrade");

/** Revalidate recommendations every 5 minutes (matches CacheTTL.MEDIUM). */
export const revalidate = 300;

import { getCachedUserCompanyId, getCachedRecommendations } from "@/lib/repositories";
import type { Recommendation } from "@/lib/engine/recommendation";
import { getBestPrice } from "@/lib/distributors";
import { MaterialIcon } from "@/components/icon";
import { Card } from "@/components/ui/card";
import { ContactModal } from "@/components/contact-modal";
import { formatCurrency } from "@/lib/utils";
import {
  MetricRing,
  getScoreDescription,
  StatusBadge,
  EmptyState,
  severityConfig,
} from "@/components/data-display";

/** Category score computed from recommendations. */
type CategoryScore = {
  category: string;
  score: number;
  count: number;
};

function computeItScore(recommendations: Recommendation[]): number {
  if (recommendations.length === 0) return 100;

  const criticalCount = recommendations.filter((r) => r.severity === "critical").length;
  const warningCount = recommendations.filter((r) => r.severity === "warning").length;
  const infoCount = recommendations.filter((r) => r.severity === null || r.severity === "info").length;

  const deductions = criticalCount * 15 + warningCount * 8 + infoCount * 3;
  return Math.max(0, Math.min(100, 100 - deductions));
}

/** Compute per-category scores from recommendations. */
function computeCategoryScores(recommendations: Recommendation[]): CategoryScore[] {
  const categoryMap = new Map<string, Recommendation[]>();

  for (const rec of recommendations) {
    const cat = rec.category || "Overig";
    const existing = categoryMap.get(cat) ?? [];
    existing.push(rec);
    categoryMap.set(cat, existing);
  }

  const scores: CategoryScore[] = Array.from(categoryMap.entries()).map(([category, recs]) => {
    const criticalCount = recs.filter((r) => r.severity === "critical").length;
    const warningCount = recs.filter((r) => r.severity === "warning").length;
    const infoCount = recs.filter((r) => r.severity === null || r.severity === "info").length;
    const deductions = criticalCount * 25 + warningCount * 15 + infoCount * 5;
    return {
      category,
      score: Math.max(0, Math.min(100, 100 - deductions)),
      count: recs.length,
    };
  });

  return scores.sort((a, b) => a.score - b.score);
}

/** Returns a human-readable explanation of why this recommendation matters. */
function getImportanceText(rec: Recommendation): string {
  if (rec.severity === "critical") {
    return "Dit is een kritiek punt dat directe aandacht vereist. Het niet adresseren hiervan kan leiden tot beveiligingsrisico's, downtime of compliance-problemen.";
  }
  if (rec.severity === "warning") {
    return "Dit verbeterpunt heeft een meetbare impact op uw IT-omgeving. Vergelijkbare bedrijven hebben dit al geïmplementeerd voor betere prestaties en beveiliging.";
  }
  return "Deze suggestie kan uw IT-omgeving verder optimaliseren. Het is geen urgente actie, maar draagt bij aan een hogere IT-score en betere gebruikerservaring.";
}

/** Score bar color based on score value. */
function getBarColor(score: number): string {
  if (score >= 80) return "bg-emerald-500";
  if (score >= 50) return "bg-yielder-orange";
  return "bg-red-500";
}

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
  const companyId = await getCachedUserCompanyId();

  if (!companyId) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <MaterialIcon name="lock" size={48} className="mx-auto mb-4 opacity-40" />
        <p>Geen bedrijf gekoppeld aan uw account.</p>
      </div>
    );
  }

  const recommendations = await getCachedRecommendations(companyId);
  const prices = await getRecommendationPrices(recommendations);
  const itScore = computeItScore(recommendations);
  const categoryScores = computeCategoryScores(recommendations);

  const criticalItems = recommendations.filter((r) => r.severity === "critical");
  const otherItems = recommendations.filter((r) => r.severity !== "critical");

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-yielder-navy">Upgrade advies</h1>
        <p className="text-muted-foreground mt-1">
          Persoonlijke aanbevelingen op basis van uw IT-omgeving
        </p>
      </div>

      {/* IT Score + Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* IT Score Card — larger ring */}
        <Card className="rounded-2xl p-8 shadow-card border flex flex-col items-center justify-center">
          <p className="text-sm font-medium text-muted-foreground mb-6">Uw IT-score</p>
          <MetricRing
            score={itScore}
            size={160}
            strokeWidth={10}
            description={getScoreDescription(itScore)}
          />
          <div className="mt-4 text-center">
            <p className="text-xs text-muted-foreground">
              {recommendations.length === 0
                ? "Geen openstaande verbeterpunten"
                : `${recommendations.length} ${recommendations.length === 1 ? "aanbeveling" : "aanbevelingen"}`}
            </p>
          </div>
        </Card>

        {/* Category Breakdown */}
        <Card className="rounded-2xl p-6 shadow-card border lg:col-span-2">
          <p className="text-sm font-medium text-muted-foreground mb-4">Score per categorie</p>
          {categoryScores.length === 0 ? (
            <div className="flex items-center gap-2 text-emerald-600">
              <MaterialIcon name="check_circle" size={20} />
              <span className="text-sm font-medium">Alle categorieën voldoen</span>
            </div>
          ) : (
            <div className="space-y-3">
              {categoryScores.map((cat) => (
                <div key={cat.category}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-foreground">
                      {cat.category}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {cat.count} {cat.count === 1 ? "punt" : "punten"}
                      </span>
                      <span className={`text-sm font-bold ${
                        cat.score >= 80 ? "text-emerald-600" :
                        cat.score >= 50 ? "text-yielder-orange" :
                        "text-red-500"
                      }`}>
                        {cat.score}%
                      </span>
                    </div>
                  </div>
                  <div className="h-2 rounded-full bg-muted/30 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${getBarColor(cat.score)}`}
                      style={{ width: `${cat.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Critical Actions — collapsible */}
      {criticalItems.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <MaterialIcon name="error" className="text-red-500" />
            <h2 className="text-lg font-semibold text-red-700">Direct actie vereist</h2>
            <span className="ml-auto text-xs text-muted-foreground">
              {criticalItems.length} {criticalItems.length === 1 ? "item" : "items"}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {criticalItems.map((rec) => (
              <RecommendationCard
                key={rec.product.id}
                rec={rec}
                price={prices.get(rec.product.id)}
                companyId={companyId}
                collapsible
              />
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
            <span className="ml-auto text-xs text-muted-foreground">
              {otherItems.length} {otherItems.length === 1 ? "item" : "items"}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {otherItems.map((rec) => (
              <RecommendationCard
                key={rec.product.id}
                rec={rec}
                price={prices.get(rec.product.id)}
                companyId={companyId}
                collapsible
              />
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {recommendations.length === 0 && (
        <EmptyState
          icon="check_circle"
          iconClassName="text-emerald-500"
          heading="Alles up-to-date"
          message="Uw IT-omgeving is compleet. Er zijn op dit moment geen aanbevelingen."
        />
      )}
    </div>
  );
}

function RecommendationCard({
  rec,
  price,
  companyId,
  collapsible = false,
}: {
  rec: Recommendation;
  price?: number | undefined;
  companyId: string;
  collapsible?: boolean;
}) {
  const isCritical = rec.severity === "critical";
  const importanceText = getImportanceText(rec);

  const cardContent = (
    <>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">{rec.category}</span>
          <StatusBadge status={rec.severity ?? "info"} config={severityConfig} />
        </div>
        {price != null && (
          <span className="text-sm font-medium text-yielder-navy whitespace-nowrap">
            vanaf {formatCurrency(price)}
          </span>
        )}
      </div>

      <h3 className="font-semibold text-foreground mb-1">{rec.product.name}</h3>
      {rec.product.vendor && (
        <p className="text-xs text-muted-foreground mb-2">{rec.product.vendor}</p>
      )}

      <p className="text-sm text-muted-foreground mb-3">{rec.reason}</p>

      {/* Waarom dit belangrijk is — collapsible detail */}
      {collapsible ? (
        <details className="mb-3 group">
          <summary className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-yielder-navy hover:text-yielder-orange transition-colors select-none">
            <MaterialIcon
              name="expand_more"
              size={16}
              className="transition-transform group-open:rotate-180"
            />
            Waarom dit belangrijk is
          </summary>
          <p className="text-xs text-muted-foreground mt-2 pl-6 leading-relaxed">
            {importanceText}
          </p>
        </details>
      ) : (
        <div className="mb-3">
          <p className="text-xs text-muted-foreground leading-relaxed">{importanceText}</p>
        </div>
      )}

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
            className={`w-full py-2.5 px-4 rounded-xl text-sm font-medium transition-colors ${
              isCritical
                ? "bg-red-600 text-white hover:bg-red-700"
                : "bg-yielder-navy text-white hover:bg-yielder-navy/90"
            }`}
          >
            <span className="flex items-center justify-center gap-2">
              <MaterialIcon name="calendar_today" size={16} />
              {rec.ctaText}
            </span>
          </button>
        }
      />
    </>
  );

  return (
    <Card
      className={`rounded-2xl p-5 shadow-card border transition-shadow hover:shadow-card-hover ${
        isCritical ? "border-red-200 bg-red-50/30" : ""
      }`}
    >
      {cardContent}
    </Card>
  );
}
