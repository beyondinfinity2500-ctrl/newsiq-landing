/**
 * AI Market Impact section — the ONE canonical premium analysis presentation.
 *
 * FREE state: blurred locked view showing only stored metadata (direction,
 * confidence) with an unlock CTA. No reasoning, no summary, no analysis text.
 *
 * PREMIUM state: full analysis with all subsections.
 *
 * Everything rendered here is clearly labelled as AI-generated analytical
 * content. We never present an AI inference as if it were a verified fact.
 */

import Link from "next/link";
import { Sparkles, AlertTriangle, TrendingUp, Clock, Layers, Globe2, ListChecks, ShieldAlert, Lightbulb, Lock } from "lucide-react";

type Direction = "bullish" | "bearish" | "mixed" | "neutral" | "uncertain";
type Horizon = "immediate" | "short_term" | "medium_term" | "long_term";
type Strength = "low" | "medium" | "high";
type AssetClass = "equities" | "indices" | "bonds" | "commodities" | "currencies" | "cryptocurrencies" | "sectors";

interface AffectedAsset {
  symbol: string;
  name: string;
  asset_class: AssetClass;
  direction: Direction;
  impact_strength: Strength;
  reasoning: string;
}
interface AffectedSector {
  sector: string;
  direction: Direction;
  reasoning: string;
}
interface EntityLite {
  name: string;
  type: string;
  relevance: number;
}
interface GeographicImpact {
  country_code?: string | null;
  region?: string | null;
  direction: Direction;
  reasoning: string;
}
interface Uncertainty {
  reason: string;
  missing_information?: string[];
  conflicting_sources?: string[];
}

export interface AiAnalysisPayload {
  summary: string;
  why_it_matters: string;
  economic_impact: string;
  market_impact: Direction;
  affected_sectors: AffectedSector[];
  affected_assets: AffectedAsset[];
  geographic_impact: GeographicImpact[];
  key_entities: EntityLite[];
  time_horizon: Horizon;
  confidence: "low" | "medium" | "high";
  risks: string[];
  opportunities: string[];
  uncertainty: Uncertainty;
  insufficient_information?: boolean;
  _meta?: { version?: string; model?: string | null; generated_at?: string };
}

const directionStyles: Record<Direction, { label: string; class: string }> = {
  bullish: { label: "Bullish", class: "bg-success/15 text-success" },
  bearish: { label: "Bearish", class: "bg-destructive/15 text-destructive" },
  mixed: { label: "Mixed", class: "bg-warning/15 text-warning" },
  neutral: { label: "Neutral", class: "bg-muted text-muted-foreground" },
  uncertain: { label: "Uncertain", class: "bg-muted text-muted-foreground" },
};

const horizonLabel: Record<Horizon, string> = {
  immediate: "Immediate",
  short_term: "Short term",
  medium_term: "Medium term",
  long_term: "Long term",
};



interface AiAnalysisSectionProps {
  analysis: AiAnalysisPayload;
  isPro?: boolean;
  /** Override the section title. Defaults to "AI Market Impact". */
  label?: string;
  /** Credit cost to display in the lock CTA. */
  creditCost?: string;
}

export function AiAnalysisSection({ analysis, isPro = false, label = "AI Market Impact", creditCost = "1 AI Analysis Credit" }: AiAnalysisSectionProps) {
  const dir = directionStyles[analysis.market_impact] ?? directionStyles.neutral;

  return (
    <section
      className="mt-8 rounded-xl border border-info/20 bg-card overflow-hidden"
      aria-label={label}
    >
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border p-5">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-info" aria-hidden="true" />
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
        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${dir.class}`}>
          {dir.label}
        </span>
      </header>

      {!isPro ? (
        <LockedPreview analysis={analysis} creditCost={creditCost} />
      ) : (
        <ProAnalysisContent analysis={analysis} />
      )}

      <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-5 py-3 text-xs text-muted-foreground">
        <span>
          Analysis version {analysis._meta?.version ?? "?"} ·{" "}
          {analysis._meta?.model ? `model ${analysis._meta.model}` : "model unknown"}
        </span>
        <span>
          This analysis is AI-generated. It is not financial advice and does not predict market outcomes with certainty.
        </span>
      </footer>
    </section>
  );
}

/**
 * Locked preview for free users. Shows ONLY stored metadata (confidence,
 * direction) — no reasoning, no summary, no analysis text is exposed.
 * The content area is blurred to tease the premium experience.
 */
function LockedPreview({ analysis, creditCost }: { analysis: AiAnalysisPayload; creditCost: string }) {
  return (
    <div className="relative min-h-[280px]">
      {/* Blurred content teaser — recognizable but not readable */}
      <div className="pointer-events-none select-none p-5 blur-[3px] opacity-60" aria-hidden="true">
        <div className="space-y-4">
          <div>
            <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
              <Sparkles className="size-4" /> Summary
            </h3>
            <p className="text-sm leading-relaxed text-foreground">{analysis.summary}</p>
          </div>
          <div>
            <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
              <TrendingUp className="size-4" /> Economic impact
            </h3>
            <p className="text-sm leading-relaxed text-foreground">{analysis.economic_impact}</p>
          </div>
          {analysis.affected_assets.length > 0 && (
            <div>
              <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
                <Layers className="size-4" /> Affected markets
              </h3>
              <div className="space-y-2">
                {analysis.affected_assets.slice(0, 3).map((a, i) => (
                  <div key={`${a.symbol}-${i}`} className="rounded-lg border border-border p-3">
                    <span className="text-sm font-semibold text-foreground">{a.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-card via-card/60 to-card/30" />

      {/* Centered CTA floating over blurred content */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center px-5 text-center">
        <div className="rounded-xl border border-border bg-card/90 px-6 py-5 shadow-lg backdrop-blur-sm">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-xs font-medium text-muted-foreground">Confidence:</span>
            <span className="text-xs font-semibold capitalize text-foreground">{analysis.confidence}</span>
          </div>
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

function ProAnalysisContent({ analysis }: { analysis: AiAnalysisPayload }) {
  return (
    <div className="space-y-5 p-5">
      {analysis.insufficient_information ? (
        <div className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/5 p-4 text-sm text-warning">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <p>
            The article did not contain enough detail for a confident analysis.{" "}
            {analysis.uncertainty?.reason}
          </p>
        </div>
      ) : null}

      <Block icon={<Sparkles className="size-4" />} title="Summary">
        <p className="text-sm leading-relaxed text-foreground">{analysis.summary}</p>
      </Block>

      <Block icon={<Lightbulb className="size-4" />} title="Why it matters">
        <p className="text-sm leading-relaxed text-foreground">{analysis.why_it_matters}</p>
      </Block>

      <Block icon={<TrendingUp className="size-4" />} title="Economic impact">
        <p className="text-sm leading-relaxed text-foreground">{analysis.economic_impact}</p>
      </Block>

      {analysis.affected_assets.length > 0 && (
        <Block icon={<Layers className="size-4" />} title="Affected markets">
          <ul className="space-y-2">
            {analysis.affected_assets.slice(0, 8).map((a, i) => (
              <li key={`${a.symbol}-${i}`} className="rounded-lg border border-border p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-foreground">
                    {a.name} <span className="text-xs font-normal text-muted-foreground">({a.symbol})</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${(directionStyles[a.direction] ?? directionStyles.neutral).class}`}>
                      {directionStyles[a.direction]?.label ?? a.direction}
                    </span>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                      {a.impact_strength}
                    </span>
                  </div>
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground">{a.reasoning}</p>
              </li>
            ))}
          </ul>
        </Block>
      )}

      {analysis.affected_sectors.length > 0 && (
        <Block icon={<ListChecks className="size-4" />} title="Affected sectors">
          <ul className="space-y-1.5 text-sm text-foreground">
            {analysis.affected_sectors.map((s, i) => (
              <li key={`${s.sector}-${i}`} className="flex items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-xs ${(directionStyles[s.direction] ?? directionStyles.neutral).class}`}>
                  {directionStyles[s.direction]?.label ?? s.direction}
                </span>
                <span className="font-medium">{s.sector}</span>
                <span className="text-muted-foreground">— {s.reasoning}</span>
              </li>
            ))}
          </ul>
        </Block>
      )}

      {analysis.geographic_impact.length > 0 && (
        <Block icon={<Globe2 className="size-4" />} title="Geographic impact">
          <ul className="space-y-1.5 text-sm text-foreground">
            {analysis.geographic_impact.map((g, i) => (
              <li key={`${g.country_code ?? g.region ?? "g"}-${i}`} className="flex items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-xs ${(directionStyles[g.direction] ?? directionStyles.neutral).class}`}>
                  {directionStyles[g.direction]?.label ?? g.direction}
                </span>
                <span className="font-medium">
                  {g.country_code ?? g.region ?? "Global"}
                </span>
                <span className="text-muted-foreground">— {g.reasoning}</span>
              </li>
            ))}
          </ul>
        </Block>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <Block icon={<Clock className="size-4" />} title="Time horizon">
          <p className="text-sm text-foreground">{horizonLabel[analysis.time_horizon] ?? analysis.time_horizon}</p>
        </Block>
        <Block icon={<ShieldAlert className="size-4" />} title="Confidence">
          <p className="text-sm capitalize text-foreground">{analysis.confidence}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Calibrated estimate that the analysis is correct, not that markets will move as predicted.
          </p>
        </Block>
      </div>

      {analysis.risks.length > 0 && (
        <Block icon={<ShieldAlert className="size-4" />} title="Key risks">
          <ul className="list-disc space-y-1 ps-5 text-sm text-foreground">
            {analysis.risks.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </Block>
      )}

      {analysis.opportunities.length > 0 && (
        <Block icon={<Lightbulb className="size-4" />} title="Key opportunities">
          <ul className="list-disc space-y-1 ps-5 text-sm text-foreground">
            {analysis.opportunities.map((o, i) => (
              <li key={i}>{o}</li>
            ))}
          </ul>
        </Block>
      )}

      {analysis.uncertainty?.reason && (
        <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
          <p>
            <strong className="font-semibold text-foreground">Uncertainty:</strong>{" "}
            {analysis.uncertainty.reason}
          </p>
          {analysis.uncertainty.missing_information && analysis.uncertainty.missing_information.length > 0 ? (
            <p className="mt-1">
              <strong className="font-semibold text-foreground">Missing:</strong>{" "}
              {analysis.uncertainty.missing_information.join("; ")}
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}

function Block({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
        {icon}
        {title}
      </h3>
      {children}
    </div>
  );
}
