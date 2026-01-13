/**
 * Sia Memory Service
 *
 * Manages persistent memory for Sia voice assistant.
 * Handles conversation history, learned facts, user preferences, and context.
 *
 * @module services/siaMemoryService
 */

import { supabase } from '@/integrations/supabase';
import { logger } from '@/lib/logger';
import type {
  SiaMemory,
  SiaMemoryInsert,
  SiaMemoryUpdate,
  SiaMemoryData,
  SiaFact,
  Json,
} from '@/integrations/supabase';

/**
 * Context data for a Sia interaction
 */
export interface SiaInteractionContext {
  message: string;
  response: string;
  topic?: string;
  facts?: Omit<SiaFact, 'id' | 'createdAt' | 'lastReferencedAt'>[];
  preferences?: Record<string, unknown>;
  timestamp?: string;
}

/**
 * Default memory data structure
 */
const DEFAULT_MEMORY_DATA: SiaMemoryData = {
  facts: [],
  preferences: {},
  context: {},
  recentTopics: [],
};

class SiaMemoryService {
  /**
   * Load Sia memory for a user.
   * Creates default memory if none exists.
   */
  async loadMemory(userId: string): Promise<SiaMemory> {
    const { data, error } = await supabase
      .from('sia_memory')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      logger.error('Failed to load Sia memory', error);
      throw new Error(`Failed to load Sia memory: ${error.message}`);
    }

    // If no memory exists, create one
    if (!data) {
      return this.initializeMemory(userId);
    }

    return data;
  }

  /**
   * Initialize memory for a new user
   */
  async initializeMemory(userId: string): Promise<SiaMemory> {
    const newMemory: SiaMemoryInsert = {
      user_id: userId,
      memory_data: DEFAULT_MEMORY_DATA as Json,
      summary: null,
      personality_adjustments: {},
      total_interactions: 0,
      last_interaction_at: null,
    };

    const { data, error } = await supabase
      .from('sia_memory')
      .insert(newMemory)
      .select()
      .single();

    if (error) {
      logger.error('Failed to initialize Sia memory', error);
      throw new Error(`Failed to initialize Sia memory: ${error.message}`);
    }

    return data;
  }

  /**
   * Update memory after a Sia interaction
   */
  async updateMemory(
    userId: string,
    context: SiaInteractionContext
  ): Promise<SiaMemory> {
    // Load current memory
    const currentMemory = await this.loadMemory(userId);
    const memoryData = (currentMemory.memory_data as SiaMemoryData) || DEFAULT_MEMORY_DATA;

    // Update facts
    const updatedFacts = [...memoryData.facts];
    if (context.facts && context.facts.length > 0) {
      for (const newFact of context.facts) {
        const fact: SiaFact = {
          id: crypto.randomUUID(),
          content: newFact.content,
          category: newFact.category,
          confidence: newFact.confidence,
          createdAt: context.timestamp || new Date().toISOString(),
          lastReferencedAt: context.timestamp || new Date().toISOString(),
        };
        updatedFacts.push(fact);
      }
    }

    // Update preferences
    const updatedPreferences = {
      ...memoryData.preferences,
      ...(context.preferences || {}),
    };

    // Update recent topics
    const updatedRecentTopics = [...memoryData.recentTopics];
    if (context.topic) {
      // Add new topic to front, remove duplicates, keep last 10
      updatedRecentTopics.unshift(context.topic);
      const uniqueTopics = Array.from(new Set(updatedRecentTopics));
      updatedRecentTopics.splice(0, updatedRecentTopics.length, ...uniqueTopics.slice(0, 10));
    }

    // Update context with recent interaction
    const updatedContext = {
      lastMessage: context.message,
      lastResponse: context.response,
      lastInteractionAt: context.timestamp || new Date().toISOString(),
    };

    // Build updated memory data
    const updatedMemoryData: SiaMemoryData = {
      facts: updatedFacts,
      preferences: updatedPreferences,
      context: updatedContext,
      recentTopics: updatedRecentTopics,
    };

    // Update database
    const updates: SiaMemoryUpdate = {
      memory_data: updatedMemoryData as Json,
      total_interactions: (currentMemory.total_interactions || 0) + 1,
      last_interaction_at: context.timestamp || new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('sia_memory')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update Sia memory', error);
      throw new Error(`Failed to update Sia memory: ${error.message}`);
    }

    return data;
  }

  /**
   * Update the rolling summary of Sia interactions
   */
  async updateSummary(userId: string, summary: string): Promise<SiaMemory> {
    const { data, error } = await supabase
      .from('sia_memory')
      .update({ summary })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update Sia memory summary', error);
      throw new Error(`Failed to update Sia memory summary: ${error.message}`);
    }

    return data;
  }

  /**
   * Get a rolling summary of user interactions
   */
  async getMemorySummary(userId: string): Promise<string | null> {
    const { data, error } = await supabase
      .from('sia_memory')
      .select('summary, memory_data, total_interactions')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      logger.error('Failed to get Sia memory summary', error);
      throw new Error(`Failed to get Sia memory summary: ${error.message}`);
    }

    if (!data) {
      return null;
    }

    // If summary exists, return it
    if (data.summary) {
      return data.summary;
    }

    // Generate summary from memory data
    const memoryData = (data.memory_data as SiaMemoryData) || DEFAULT_MEMORY_DATA;
    const factsCount = memoryData.facts.length;
    const topicsCount = memoryData.recentTopics.length;
    const interactionsCount = data.total_interactions || 0;

    return `Sia has had ${interactionsCount} interactions with you, learning ${factsCount} facts and discussing ${topicsCount} recent topics.`;
  }

  /**
   * Clear all memory for a user
   */
  async clearMemory(userId: string): Promise<void> {
    const { error } = await supabase
      .from('sia_memory')
      .update({
        memory_data: DEFAULT_MEMORY_DATA as Json,
        summary: null,
        personality_adjustments: {},
        total_interactions: 0,
        last_interaction_at: null,
      })
      .eq('user_id', userId);

    if (error) {
      logger.error('Failed to clear Sia memory', error);
      throw new Error(`Failed to clear Sia memory: ${error.message}`);
    }
  }

  /**
   * Get specific facts by category
   */
  async getFactsByCategory(
    userId: string,
    category: SiaFact['category']
  ): Promise<SiaFact[]> {
    const memory = await this.loadMemory(userId);
    const memoryData = (memory.memory_data as SiaMemoryData) || DEFAULT_MEMORY_DATA;

    return memoryData.facts.filter(fact => fact.category === category);
  }

  /**
   * Remove a specific fact
   */
  async removeFact(userId: string, factId: string): Promise<SiaMemory> {
    const memory = await this.loadMemory(userId);
    const memoryData = (memory.memory_data as SiaMemoryData) || DEFAULT_MEMORY_DATA;

    const updatedFacts = memoryData.facts.filter(fact => fact.id !== factId);
    const updatedMemoryData: SiaMemoryData = {
      ...memoryData,
      facts: updatedFacts,
    };

    const { data, error } = await supabase
      .from('sia_memory')
      .update({ memory_data: updatedMemoryData as Json })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to remove fact from Sia memory', error);
      throw new Error(`Failed to remove fact: ${error.message}`);
    }

    return data;
  }

  /**
   * Update personality adjustments
   */
  async updatePersonality(
    userId: string,
    adjustments: Record<string, unknown>
  ): Promise<SiaMemory> {
    const { data, error } = await supabase
      .from('sia_memory')
      .update({ personality_adjustments: adjustments as Json })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update Sia personality', error);
      throw new Error(`Failed to update Sia personality: ${error.message}`);
    }

    return data;
  }

  /**
   * Get user preferences from memory
   */
  async getPreferences(userId: string): Promise<Record<string, unknown>> {
    const memory = await this.loadMemory(userId);
    const memoryData = (memory.memory_data as SiaMemoryData) || DEFAULT_MEMORY_DATA;
    return memoryData.preferences;
  }

  /**
   * Update user preferences
   */
  async updatePreferences(
    userId: string,
    preferences: Record<string, unknown>
  ): Promise<SiaMemory> {
    const memory = await this.loadMemory(userId);
    const memoryData = (memory.memory_data as SiaMemoryData) || DEFAULT_MEMORY_DATA;

    const updatedMemoryData: SiaMemoryData = {
      ...memoryData,
      preferences: {
        ...memoryData.preferences,
        ...preferences,
      },
    };

    const { data, error } = await supabase
      .from('sia_memory')
      .update({ memory_data: updatedMemoryData as Json })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update Sia preferences', error);
      throw new Error(`Failed to update Sia preferences: ${error.message}`);
    }

    return data;
  }

  /**
   * Get recent topics discussed
   */
  async getRecentTopics(userId: string): Promise<string[]> {
    const memory = await this.loadMemory(userId);
    const memoryData = (memory.memory_data as SiaMemoryData) || DEFAULT_MEMORY_DATA;
    return memoryData.recentTopics;
  }

  /**
   * Get interaction statistics
   */
  async getInteractionStats(userId: string): Promise<{
    totalInteractions: number;
    lastInteractionAt: string | null;
    factsCount: number;
    topicsCount: number;
  }> {
    const memory = await this.loadMemory(userId);
    const memoryData = (memory.memory_data as SiaMemoryData) || DEFAULT_MEMORY_DATA;

    return {
      totalInteractions: memory.total_interactions || 0,
      lastInteractionAt: memory.last_interaction_at,
      factsCount: memoryData.facts.length,
      topicsCount: memoryData.recentTopics.length,
    };
  }
}

export const siaMemoryService = new SiaMemoryService();
