"use client";

import { useState } from "react";
import { AiSuggestion } from "@/features/ai/suggestions";
import { generateAISuggestion, saveAISuggestionToDatabase } from "@/features/ai/suggestions";

interface SuggestionFormProps {
  onSuggestionGenerated: (suggestion: AiSuggestion) => void;
  onClose: () => void;
}

export function useAISuggestionForm({ onSuggestionGenerated, onClose }: SuggestionFormProps) {
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<AiSuggestion | null>(null);
  const [error, setError] = useState<string | null>(null);

  const triggerSuggestion = async (query: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await generateAISuggestion({ query });
      if (result) {
        setSuggestion(result);
        onSuggestionGenerated(result);
      } else {
        setError("Failed to generate AI suggestion. Please try again.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const acceptSuggestion = async () => {
    if (!suggestion) return;
    try {
      const { postId } = await saveAISuggestionToDatabase(suggestion, "");
      // Return the postId so the admin can proceed to review
      onSuggestionGenerated({ ...suggestion, _postId: postId });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  };

  const rejectSuggestion = () => {
    setSuggestion(null);
    onClose();
  };

  return {
    loading,
    suggestion,
    error,
    triggerSuggestion,
    acceptSuggestion,
    rejectSuggestion,
  };
}