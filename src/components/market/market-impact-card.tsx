import { BarChart3, Info } from "lucide-react";
import type { MarketImpactResult } from "@/lib/ai/types";
import type { MarketAsset } from "@/lib/supabase/types";
import { DirectionBadge } from "./direction-badge";
import { ImpactBadge } from "./impact-badge";
import { ConfidenceMeter } from "./confidence-meter";

const assetLabels: Record<MarketAsset, string> = {
  gold: "Gold",
  oil: "Oil",
  silver: "Silver",
  natural_gas: "Natural Gas",
  copper: "Copper",
  agricultural: "Agricultural",
  bitcoin: "Bitcoin",
  ethereum: "Ethereum",
  defi: "DeFi",
  forex: "Forex",
  government_bonds: "Government Bonds",
  us_treasury: "US Treasury",
  real_estate: "Real Estate",
  global_indexes: "Global Indexes",
};

export function MarketImpactCard({ analysis, isPro = false, label = "Market Impact" }: { analysis: MarketImpactResult; isPro?: boolean; label?: string }) {
  return (
    <section className="rounded-xl border border-border bg-card p-6" aria-label={label}>
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 size={18} className="text-info" aria-hidden="true" />
            <h2 className="text-lg font-bold text-foreground">{label}</h2>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Analysis based on this news event. Not personalized financial advice.
          </p>
        </div>
        <ConfidenceMeter score={analysis.confidence} />
      </div>

      <div className="mb-5 flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2">
        <span className="text-xs font-medium text-muted-foreground">Overall sentiment:</span>
        <span className="text-sm font-semibold capitalize text-foreground">{analysis.overallSentiment}</span>
      </div>

      {isPro ? (
        <>
          <div className="space-y-3">
            {analysis.affectedAssets.map((item, i) => (
              <div key={i} className="rounded-lg border border-border p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-foreground">{assetLabels[item.asset] ?? item.asset}</span>
                  <div className="flex items-center gap-2">
                    <DirectionBadge direction={item.direction} />
                    <ImpactBadge level={item.impactLevel} />
                  </div>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{item.reasoning}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-lg bg-muted/30 p-4">
            <p className="text-sm leading-relaxed text-foreground">{analysis.analysis}</p>
          </div>

          <div className="mt-4 flex items-start gap-2 rounded-lg border border-info/20 bg-info/5 px-3 py-2">
            <Info size={14} className="mt-0.5 shrink-0 text-info" aria-hidden="true" />
            <p className="text-xs text-muted-foreground">
              This analysis is AI-generated for informational purposes only. It is not financial advice. Always do your own research.
            </p>
          </div>
        </>
      ) : (
        <FreePreview analysis={analysis} />
      )}
    </section>
  );
}

function FreePreview({ analysis }: { analysis: MarketImpactResult }) {
  const preview = analysis.affectedAssets.slice(0, 2);
  return (
    <div>
      <div className="space-y-3">
        {preview.map((item, i) => (
          <div key={i} className="rounded-lg border border-border p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-semibold text-foreground">{assetLabels[item.asset] ?? item.asset}</span>
              <DirectionBadge direction={item.direction} />
            </div>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{item.reasoning}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-lg border border-dashed border-border bg-muted/20 p-4 text-center">
        <p className="text-sm font-medium text-foreground">{analysis.affectedAssets.length - preview.length} more markets affected</p>
        <p className="mt-1 text-xs text-muted-foreground">Full analysis, key risks, opportunities, and time horizon with Pro</p>
        <button className="mt-3 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90">
          View Full Analysis
        </button>
      </div>
    </div>
  );
}
