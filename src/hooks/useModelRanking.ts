import { useState, useCallback } from "react";
import { supabase } from "@/services/supabaseClient";
import { useCurrentUser } from "@/hooks/useCurrentUser";

export type QueryType = "chat" | "code" | "image" | "analysis";

export interface RankedModel {
  id: string;
  name: string;
  display_name: string;
  provider: string;
  api_path: string;
  kind: string;
  mode: string;
  context_length: number;
  max_tokens: number;
  cost_per_1k_input: number;
  cost_per_1k_output: number;
  score: number;
}

interface FetchModelsResult {
  models: RankedModel[];
  message?: string;
  userMessage?: string;
}

interface UseModelRankingReturn {
  rankedModels: RankedModel[];
  isLoading: boolean;
  error: string | null;
  fetchDiverseModels: (queryType?: QueryType, limit?: number) => Promise<FetchModelsResult>;
  analyzeQueryType: (query: string) => QueryType;
}

/**
 * Hook for fetching diverse models for comparison
 * Uses the diverse-models-for-comparison edge function
 */
export function useModelRanking(): UseModelRankingReturn {
  const user = useCurrentUser();
  const [rankedModels, setRankedModels] = useState<RankedModel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Analyzes a query string to determine its type
   * Used for smart model selection
   */
  const analyzeQueryType = useCallback((query: string): QueryType => {
    const lowerQuery = query.toLowerCase();

    // Code-related keywords
    const codeKeywords = [
      "code", "function", "class", "debug", "error", "bug", "fix",
      "implement", "refactor", "typescript", "javascript", "python",
      "react", "api", "database", "sql", "algorithm", "syntax",
      "compile", "runtime", "variable", "loop", "array", "object",
      "async", "promise", "component", "module", "import", "export"
    ];

    // Image-related keywords
    const imageKeywords = [
      "image", "picture", "photo", "draw", "generate image", "create image",
      "visualize", "illustration", "diagram", "chart", "graph", "design",
      "logo", "icon", "screenshot", "ui design", "mockup"
    ];

    // Analysis-related keywords (typically need large context)
    const analysisKeywords = [
      "analyze", "analysis", "summarize", "summary", "review", "evaluate",
      "compare", "contrast", "explain in detail", "comprehensive",
      "research", "report", "document", "long", "entire", "whole",
      "all of", "complete", "thorough", "deep dive"
    ];

    // Check for code patterns (code blocks, file extensions, etc.)
    const codePatterns = [
      /```[\s\S]*```/, // Code blocks
      /\.(ts|tsx|js|jsx|py|java|cpp|c|go|rs|rb|php|swift|kt)/, // File extensions
      /function\s*\(/, // Function declarations
      /const\s+\w+\s*=/, // Variable declarations
      /import\s+.*from/, // Import statements
      /class\s+\w+/, // Class declarations
    ];

    // Check code patterns first (highest priority)
    for (const pattern of codePatterns) {
      if (pattern.test(query)) {
        return "code";
      }
    }

    // Check keywords
    if (codeKeywords.some(keyword => lowerQuery.includes(keyword))) {
      return "code";
    }

    if (imageKeywords.some(keyword => lowerQuery.includes(keyword))) {
      return "image";
    }

    if (analysisKeywords.some(keyword => lowerQuery.includes(keyword))) {
      return "analysis";
    }

    // Default to chat
    return "chat";
  }, []);

  /**
   * Fetches diverse models from the edge function
   * Returns models from different providers with compatible endpoints
   */
  const fetchDiverseModels = useCallback(async (
    queryType: QueryType = "chat",
    limit: number = 4
  ): Promise<FetchModelsResult> => {
    if (!user?.email) {
      setError("User not authenticated");
      return { models: [] };
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: invokeError } = await supabase.functions.invoke(
        "diverse-models-for-comparison",
        {
          body: {
            query_type: queryType,
            limit
          }
        }
      );

      if (invokeError) {
        throw new Error(invokeError.message);
      }

      if (!data?.success) {
        throw new Error(data?.error || "Failed to fetch models");
      }

      const models = (data.models as RankedModel[]) || [];
      setRankedModels(models);

      console.log(`[useModelRanking] Fetched ${models.length} diverse models for ${queryType}`);
      if (data.message) {
        console.log(`[useModelRanking] Message: ${data.message}`);
      }
      models.forEach(m => console.log(`  - ${m.name} (${m.provider}) score: ${m.score}`));

      return {
        models,
        message: data.message,
        userMessage: data.user_message
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch models";
      setError(errorMessage);
      console.error("useModelRanking error:", err);
      return { models: [] };
    } finally {
      setIsLoading(false);
    }
  }, [user?.email]);

  return {
    rankedModels,
    isLoading,
    error,
    fetchRankedModels: fetchDiverseModels, // Keep old name for compatibility
    analyzeQueryType
  };
}
