import { getTickets, getHardwareAssets } from "@/lib/repositories";
import {
  calculateHealthScores,
  generateHealthTrends,
  getOverallScore,
  getScoreColorClass,
  getScoreLabelText,
  getScoreRingColor,
} from "@/lib/health-scores";
import { MaterialIcon } from "@/components/icon";
import { Badge } from "@/components/ui/badge";
import { LazyHealthTrendChart } from "@/components/lazy-charts";
import { MetricRing } from "@/components/data-display";

function getOverallBadge(score: number): {
  label: string;
  className: string;
} {
  if (score >= 80)
    return {
      label: "Gezond",
      className:
        "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    };
  if (score >= 60)
    return {
      label: "Aandacht nodig",
      className:
        "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    };
  return {
    label: "Actie vereist",
    className:
      "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  };
}

export default async function ITGezondheidPage() {
  const [tickets, hardware] = await Promise.all([
    getTickets(),
    getHardwareAssets(),
  ]);

  const scores = calculateHealthScores(tickets, hardware);
  const trends = generateHealthTrends(scores);
  const overall = getOverallScore(scores);
  const overallBadge = getOverallBadge(overall);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="section-title text-2xl">IT-gezondheid</h1>
        <Badge className={overallBadge.className}>{overallBadge.label}</Badge>
      </div>

      {/* Overall score + ring scores */}
      <div className="bg-card rounded-2xl p-6 shadow-card border border-border mb-6">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* Overall */}
          <MetricRing
            score={overall}
            label={getScoreLabelText(overall)}
            size={128}
          />

          {/* Individual scores */}
          <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {scores.map((score) => (
              <MetricRing
                key={score.category}
                score={score.score}
                label={score.label}
                size={112}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Score detail cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {scores.map((score) => (
          <div
            key={score.category}
            className="bg-card rounded-2xl p-5 shadow-card border border-border"
          >
            <div className="flex items-center gap-2 mb-3">
              <MaterialIcon
                name={score.icon}
                className={getScoreColorClass(score.score)}
                size={24}
              />
              <h2 className="font-semibold text-sm">{score.label}</h2>
              <span
                className={`ml-auto text-lg font-bold ${getScoreColorClass(score.score)}`}
              >
                {score.score}%
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {score.description}
            </p>
            <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${score.score}%`,
                  backgroundColor: getScoreRingColor(score.score),
                }}
              />
            </div>
            <p
              className={`text-xs font-medium mt-2 ${getScoreColorClass(score.score)}`}
            >
              {getScoreLabelText(score.score)}
            </p>
          </div>
        ))}
      </div>

      {/* Trend chart */}
      <div className="bg-card rounded-2xl p-6 shadow-card border border-border mb-6">
        <h2 className="text-sm font-semibold text-foreground mb-4">
          Trend afgelopen 6 maanden
        </h2>
        <LazyHealthTrendChart data={trends} />
      </div>

      {/* Tips */}
      <div className="bg-card rounded-2xl p-6 shadow-card border border-border">
        <h2 className="text-sm font-semibold text-foreground mb-4">
          Aanbevelingen
        </h2>
        <div className="space-y-3">
          {scores
            .filter((s) => s.score < 80)
            .map((score) => (
              <div
                key={score.category}
                className="flex items-start gap-3 p-3 rounded-xl bg-yellow-50 border border-yellow-200"
              >
                <MaterialIcon
                  name="lightbulb"
                  className="text-yellow-600 shrink-0"
                  size={20}
                />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {score.label} verbeteren ({score.score}%)
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {getRecommendation(score.category)}
                  </p>
                </div>
              </div>
            ))}
          {scores.every((s) => s.score >= 80) && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200">
              <MaterialIcon
                name="check_circle"
                className="text-emerald-500 shrink-0"
                size={20}
              />
              <p className="text-sm font-medium text-emerald-700">
                Alle scores zijn goed! Blijf monitoren voor optimale
                IT-gezondheid.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getRecommendation(category: string): string {
  switch (category) {
    case "uptime":
      return "Overweeg redundante systemen of een upgrade van uw infrastructuur om downtime te minimaliseren.";
    case "patching":
      return "Meerdere apparaten hebben verouderde software of verlopen garantie. Plan updates in om kwetsbaarheden te verhelpen.";
    case "backups":
      return "Controleer uw back-upbeleid en test regelmatig of restores succesvol zijn.";
    case "security":
      return "Er zijn beveiligingsrisico\u2019s gedetecteerd. Overweeg endpoint protection en security awareness training.";
    default:
      return "Neem contact op met Yielder voor een gerichte verbetering.";
  }
}
