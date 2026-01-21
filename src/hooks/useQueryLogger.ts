import { useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

interface LogQueryParams {
  conversationId?: string;
  queryText: string;
  queryType?: "chat" | "code" | "image" | "analysis" | "automation" | "agent";
  modelUsed?: string;
  responseSummary?: string;
  keyTopics?: string[];
  tokensInput?: number;
  tokensOutput?: number;
  responseTimeMs?: number;
}

interface ContextMemory {
  id: string;
  memory_type: string;
  content: string;
  confidence: number;
  last_accessed_at: string;
  access_count: number;
}

interface QueryLog {
  id: string;
  query_text: string;
  response_summary: string | null;
  key_topics: string[];
  query_type: string;
  model_used: string | null;
  created_at: string;
}

export function useQueryLogger(userEmail: string | undefined) {
  const pendingLogRef = useRef<string | null>(null);

  /**
   * Log a query to the database
   */
  const logQuery = useCallback(
    async (params: LogQueryParams): Promise<string | null> => {
      if (!userEmail) return null;

      try {
        const { data, error } = await supabase.rpc("log_query", {
          p_user_email: userEmail,
          p_conversation_id: params.conversationId || null,
          p_query_text: params.queryText,
          p_query_type: params.queryType || "chat",
          p_model_used: params.modelUsed || null,
          p_response_summary: params.responseSummary || null,
          p_key_topics: params.keyTopics || [],
          p_tokens_input: params.tokensInput || 0,
          p_tokens_output: params.tokensOutput || 0,
          p_response_time_ms: params.responseTimeMs || 0,
        });

        if (error) {
          console.error("[QueryLogger] Error logging query:", error);
          return null;
        }

        return data as string;
      } catch (err) {
        console.error("[QueryLogger] Exception logging query:", err);
        return null;
      }
    },
    [userEmail]
  );

  /**
   * Search through query logs
   */
  const searchQueryLogs = useCallback(
    async (searchQuery: string, limit = 20, offset = 0): Promise<QueryLog[]> => {
      if (!userEmail) return [];

      try {
        const { data, error } = await supabase.rpc("search_query_logs", {
          p_user_email: userEmail,
          p_search_query: searchQuery,
          p_limit: limit,
          p_offset: offset,
        });

        if (error) {
          console.error("[QueryLogger] Error searching logs:", error);
          return [];
        }

        return (data as QueryLog[]) || [];
      } catch (err) {
        console.error("[QueryLogger] Exception searching logs:", err);
        return [];
      }
    },
    [userEmail]
  );

  /**
   * Get recent context for continuity
   */
  const getRecentContext = useCallback(
    async (limit = 10): Promise<QueryLog[]> => {
      if (!userEmail) return [];

      try {
        const { data, error } = await supabase.rpc("get_recent_context", {
          p_user_email: userEmail,
          p_limit: limit,
        });

        if (error) {
          console.error("[QueryLogger] Error getting context:", error);
          return [];
        }

        return (data as QueryLog[]) || [];
      } catch (err) {
        console.error("[QueryLogger] Exception getting context:", err);
        return [];
      }
    },
    [userEmail]
  );

  /**
   * Get user memories
   */
  const getUserMemories = useCallback(
    async (memoryType?: string): Promise<ContextMemory[]> => {
      if (!userEmail) return [];

      try {
        const { data, error } = await supabase.rpc("get_user_memories", {
          p_user_email: userEmail,
          p_memory_type: memoryType || null,
        });

        if (error) {
          console.error("[QueryLogger] Error getting memories:", error);
          return [];
        }

        return (data as ContextMemory[]) || [];
      } catch (err) {
        console.error("[QueryLogger] Exception getting memories:", err);
        return [];
      }
    },
    [userEmail]
  );

  /**
   * Bookmark a query (mark as important)
   */
  const bookmarkQuery = useCallback(
    async (queryId: string, isBookmark = true): Promise<boolean> => {
      if (!userEmail) return false;

      try {
        const { error } = await supabase
          .from("query_logs")
          .update({ is_bookmark: isBookmark, importance_score: isBookmark ? 8 : 0 })
          .eq("id", queryId)
          .eq("user_email", userEmail);

        if (error) {
          console.error("[QueryLogger] Error bookmarking:", error);
          return false;
        }

        return true;
      } catch (err) {
        console.error("[QueryLogger] Exception bookmarking:", err);
        return false;
      }
    },
    [userEmail]
  );

  /**
   * Add context tags to a query
   */
  const addContextTags = useCallback(
    async (queryId: string, tags: string[]): Promise<boolean> => {
      if (!userEmail) return false;

      try {
        const { error } = await supabase
          .from("query_logs")
          .update({ context_tags: tags })
          .eq("id", queryId)
          .eq("user_email", userEmail);

        if (error) {
          console.error("[QueryLogger] Error adding tags:", error);
          return false;
        }

        return true;
      } catch (err) {
        console.error("[QueryLogger] Exception adding tags:", err);
        return false;
      }
    },
    [userEmail]
  );

  /**
   * Save a memory
   */
  const saveMemory = useCallback(
    async (
      memoryType: "fact" | "preference" | "project" | "person" | "skill" | "goal",
      content: string,
      sourceQueryId?: string,
      sourceConversationId?: string,
      confidence = 0.8
    ): Promise<string | null> => {
      if (!userEmail) return null;

      try {
        const { data, error } = await supabase
          .from("context_memories")
          .insert({
            user_email: userEmail,
            memory_type: memoryType,
            content,
            source_query_id: sourceQueryId || null,
            source_conversation_id: sourceConversationId || null,
            confidence,
          })
          .select("id")
          .single();

        if (error) {
          console.error("[QueryLogger] Error saving memory:", error);
          return null;
        }

        return data?.id || null;
      } catch (err) {
        console.error("[QueryLogger] Exception saving memory:", err);
        return null;
      }
    },
    [userEmail]
  );

  /**
   * Delete a memory
   */
  const deleteMemory = useCallback(
    async (memoryId: string): Promise<boolean> => {
      if (!userEmail) return false;

      try {
        const { error } = await supabase
          .from("context_memories")
          .delete()
          .eq("id", memoryId)
          .eq("user_email", userEmail);

        if (error) {
          console.error("[QueryLogger] Error deleting memory:", error);
          return false;
        }

        return true;
      } catch (err) {
        console.error("[QueryLogger] Exception deleting memory:", err);
        return false;
      }
    },
    [userEmail]
  );

  /**
   * Start tracking a query (called before sending)
   */
  const startQueryTracking = useCallback((queryText: string) => {
    pendingLogRef.current = queryText;
    return Date.now();
  }, []);

  /**
   * Complete query tracking (called after response)
   */
  const completeQueryTracking = useCallback(
    async (
      startTime: number,
      params: Omit<LogQueryParams, "queryText" | "responseTimeMs">
    ): Promise<string | null> => {
      const queryText = pendingLogRef.current;
      if (!queryText) return null;

      const responseTimeMs = Date.now() - startTime;
      pendingLogRef.current = null;

      return logQuery({
        ...params,
        queryText,
        responseTimeMs,
      });
    },
    [logQuery]
  );

  return {
    logQuery,
    searchQueryLogs,
    getRecentContext,
    getUserMemories,
    bookmarkQuery,
    addContextTags,
    saveMemory,
    deleteMemory,
    startQueryTracking,
    completeQueryTracking,
  };
}
