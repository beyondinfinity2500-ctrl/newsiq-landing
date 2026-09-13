"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Heart, MessageCircle, Share2, Bookmark, Flag, Check } from "lucide-react";

function getLikedArticles(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem("newsiq_likes");
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function persistLikedArticles(liked: Set<string>) {
  try {
    localStorage.setItem("newsiq_likes", JSON.stringify([...liked]));
  } catch {}
}

const PARTICLE_COUNT = 8;

function generateParticles() {
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => {
    const angle = (i / PARTICLE_COUNT) * 360 + (Math.random() * 30 - 15);
    const distance = 14 + Math.random() * 10;
    const size = 2 + Math.random() * 2;
    const delay = Math.random() * 80;
    return { angle, distance, size, delay, id: i };
  });
}

export function EngagementBar({ articleId, locale }: { articleId: string; locale: string }) {
  const [liked, setLiked] = useState(false);
  const [particles, setParticles] = useState<ReturnType<typeof generateParticles>>([]);
  const [showParticles, setShowParticles] = useState(false);
  const particleKey = useRef(0);
  const [saved, setSaved] = useState(false);
  const [shared, setShared] = useState(false);
  const [showReport, setShowReport] = useState(false);

  useEffect(() => {
    const likedArticles = getLikedArticles();
    setLiked(likedArticles.has(articleId));
  }, [articleId]);

  const toggleLike = useCallback(() => {
    const next = !liked;
    setLiked(next);
    if (next) {
      particleKey.current += 1;
      setParticles(generateParticles());
      setShowParticles(true);
      setTimeout(() => setShowParticles(false), 550);
    }
    const likedArticles = getLikedArticles();
    if (next) likedArticles.add(articleId);
    else likedArticles.delete(articleId);
    persistLikedArticles(likedArticles);
  }, [liked, articleId]);

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={toggleLike}
        className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        aria-label={liked ? "Unlike" : "Like"}
        aria-pressed={liked}
      >
        <span className="relative inline-flex items-center justify-center">
          <Heart
            size={15}
            className={`transition-all duration-300 ${liked ? "fill-amber-500 text-amber-500 scale-110" : ""}`}
            aria-hidden="true"
          />
          {showParticles && (
            <span className="pointer-events-none absolute inset-0" aria-hidden="true">
              {particles.map((p) => {
                const rad = (p.angle * Math.PI) / 180;
                const tx = Math.cos(rad) * p.distance;
                const ty = Math.sin(rad) * p.distance;
                return (
                  <span
                    key={`${particleKey.current}-${p.id}`}
                    className="like-particle"
                    style={{
                      width: p.size,
                      height: p.size,
                      left: "50%",
                      top: "50%",
                      marginLeft: -p.size / 2,
                      marginTop: -p.size / 2,
                      "--tx": `${tx}px`,
                      "--ty": `${ty}px`,
                      animationDelay: `${p.delay}ms`,
                    } as React.CSSProperties}
                  />
                );
              })}
            </span>
          )}
        </span>
      </button>

      <button
        className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        aria-label="Comment"
      >
        <MessageCircle size={15} aria-hidden="true" />
      </button>

      <button
        onClick={() => { setShared(true); setTimeout(() => setShared(false), 2000); }}
        className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        aria-label="Share"
      >
        {shared ? <Check size={15} className="text-success" aria-hidden="true" /> : <Share2 size={15} aria-hidden="true" />}
      </button>

      <button
        onClick={() => setSaved(!saved)}
        className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        aria-label={saved ? "Remove bookmark" : "Save"}
        aria-pressed={saved}
      >
        <Bookmark size={15} className={saved ? "fill-foreground text-foreground" : ""} aria-hidden="true" />
      </button>

      <button
        onClick={() => setShowReport(!showReport)}
        className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        aria-label="Report it"
      >
        <Flag size={15} aria-hidden="true" />
      </button>

      {showReport && <ReportDialog articleId={articleId} locale={locale} onClose={() => setShowReport(false)} />}
    </div>
  );
}

function ReportDialog({ articleId, locale, onClose }: { articleId: string; locale: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-label="Report what you saw">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
        <h3 className="text-lg font-bold text-foreground">Report It</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Did you witness this event? Share what you saw. Your report will be clearly marked as an unverified eyewitness account.
        </p>
        <textarea
          className="mt-4 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          rows={4}
          placeholder="Describe what you witnessed..."
          aria-label="Your eyewitness report"
        />
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted">Cancel</button>
          <button onClick={onClose} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">Submit Report</button>
        </div>
      </div>
    </div>
  );
}
