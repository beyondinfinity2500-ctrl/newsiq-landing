import { BarChart3, Info, Lock } from "lucide-react";
import Link from "next/link";
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

export function MarketImpactCard({ analysis, isPro = false, label = "AI Market Impact", creditCost = "1 AI Analysis Credit" }: { analysis: MarketImpactResult; isPro?: boolean; label?: string; creditCost?: string }) {
  return (
    <section className="rounded-xl border border-info/20 bg-card overflow-hidden" aria-label={label}>
      <div className="mb-5 flex items-start justify-between gap-4 border-b border-border p-5 pb-0">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 size={18} className="text-info" aria-hidden="true" />
            <h2 className="text-lg font-bold text-foreground">{label}</h2>
            {!isPro && (
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                <Lock size={10} aria-hidden="true" /> Locked
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            AI-generated market impact analysis. Not financial advice.
          </p>
        </div>
        <ConfidenceMeter score={analysis.confidence} />
      </div>

      {isPro ? (
        <ProContent analysis={analysis} />
      ) : (
        <LockedPreview analysis={analysis} creditCost={creditCost} />
      )}
    </section>
  );
}

/**
 * Locked preview — shows ONLY asset names and direction badges (stored
 * metadata). No reasoning is exposed. Content is blurred.
 */
function LockedPreview({ analysis, creditCost }: { analysis: MarketImpactResult; creditCost: string }) {
  return (
    <div className="relative min-h-[280px]">
      {/* Blurred content teaser — recognizable but not readable */}
      <div className="pointer-events-none select-none p-5 blur-[3px] opacity-60" aria-hidden="true">
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2">
          <span className="text-xs font-medium text-muted-foreground">Overall sentiment:</span>
          <span className="text-sm font-semibold capitalize text-foreground">{analysis.overallSentiment}</span>
        </div>
        <div className="space-y-3">
          {analysis.affectedAssets.slice(0, 4).map((item, i) => (
            <div key={i} className="rounded-lg border border-border p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-foreground">{assetLabels[item.asset] ?? item.asset}</span>
                <div className="flex items-center gap-2">
                  <DirectionBadge direction={item.direction} />
                  <ImpactBadge level={item.impactLevel} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-card via-card/60 to-card/30" />

      {/* Centered CTA floating over blurred content */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center px-5 text-center">
        <div className="rounded-xl border border-border bg-card/90 px-6 py-5 shadow-lg backdrop-blur-sm">
          <p className="text-xs text-muted-foreground mb-3">{creditCost}</p>
          <Link
            href="/subscribe"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Lock size={14} aria-hidden="true" />
            Unlock full analysis
          </Link>
        </div>
      </div>
    </div>
  );
}

function ProContent({ analysis }: { analysis: MarketImpactResult }) {
  return (
    <div className="p-5">
      <div className="mb-5 flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2">
        <span className="text-xs font-medium text-muted-foreground">Overall sentiment:</span>
        <span className="text-sm font-semibold capitalize text-foreground">{analysis.overallSentiment}</span>
      </div>

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
    </div>
  );
}
