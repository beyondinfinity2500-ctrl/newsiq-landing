"use client";

import { useState } from "react";
import { AiSuggestion } from "@/features/ai/suggestions";
import { generateAISuggestion, saveAISuggestionToDatabase } from "@/features/ai/suggestions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function SuggestionGenerationPage() {
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<AiSuggestion | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const generate = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await generateAISuggestion({ query });
      if (result) {
        setSuggestion(result);
      } else {
        setError("Failed to generate AI suggestion. Please try again.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const accept = async () => {
    if (!suggestion) return;
    try {
      const { postId } = await saveAISuggestionToDatabase(suggestion, "");
      // Navigate to the post edit page
      const url = `/admin/posts/${postId}`;
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  };

  const close = () => {
    setSuggestion(null);
    setQuery("");
  };

  return (
    <div className="min-h-screen bg-background p-6 lg:p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-foreground mb-4">
          AI Story Suggestion
        </h1>

        {error && (
          <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="mb-6">
          <label className="block text-sm font-medium text-foreground mb-2">
            Story topic or query:
          </label>
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. 'OPEC meeting oil prices' or 'AI regulation global impact'"
            disabled={loading}
          />
        </div>

        <div className="mb-8">
          <Button
            disabled={loading}
            onClick={generate}
            className="w-full">
            {loading
              ? "Generating..."
              : "Generate AI Suggestion"}
          </Button>
        </div>

        {suggestion && (
          <div className="rounded-lg border p-6 bg-card mb-8">
            <h2 className="text-xl font-bold text-foreground mb-4">
              Suggested Story
            </h2>

            <div className="mb-4">
              <h3 className="text-lg font-medium text-foreground mb-2">
                {suggestion.proposed_headline}
              </h3>
              <p className="text-muted-foreground line-clamp-4">
                {suggestion.reason_why_it_matters}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
              <div>
                <strong>Source:</strong> {suggestion.source}
              </div>
              <div>
                <strong>Region:</strong> {suggestion.detected_region || "Global"}
              </div>
              <div>
                <strong>Category:</strong> {suggestion.category || "Unclassified"}
              </div>
              <div>
                <strong>Urgency:</strong> {suggestion.urgency_importance}
              </div>
            </div>

            {suggestion.entities && suggestion.entities.length > 0 && (
              <div className="mt-4">
                <strong>Key Entities:</strong>
                <ul className="mt-1 space-y-1 max-h-24 overflow-y-auto text-xs">
                  {suggestion.entities.map((entity, i) => (
                    <li key={i}>{entity}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-6 flex gap-3">
              <Button
                variant="default"
                onClick={close}
                className="flex-1">
                Cancel
              </Button>
              <Button
                variant="default"
                onClick={accept}
                disabled={!suggestion}
                className="flex-1">
                Accept & Create Draft
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}