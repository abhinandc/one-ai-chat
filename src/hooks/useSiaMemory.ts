/**
 * useSiaMemory Hook
 *
 * React hook for managing Sia voice assistant memory.
 * Provides access to persistent conversation history, learned facts,
 * user preferences, and interaction context.
 *
 * @module hooks/useSiaMemory
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { siaMemoryService, type SiaInteractionContext } from '@/services/siaMemoryService';
import type { SiaMemory, SiaFact } from '@/integrations/supabase';

/**
 * Hook for accessing and managing Sia memory
 */
export function useSiaMemory(userId: string | undefined) {
  const queryClient = useQueryClient();
  const enabled = Boolean(userId);

  // Query for loading memory
  const {
    data: memory,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['sia-memory', userId],
    queryFn: () => siaMemoryService.loadMemory(userId!),
    enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Mutation for updating memory after interaction
  const updateMemoryMutation = useMutation({
    mutationFn: (context: SiaInteractionContext) =>
      siaMemoryService.updateMemory(userId!, context),
    onSuccess: (data) => {
      queryClient.setQueryData(['sia-memory', userId], data);
    },
  });

  // Mutation for updating summary
  const updateSummaryMutation = useMutation({
    mutationFn: (summary: string) =>
      siaMemoryService.updateSummary(userId!, summary),
    onSuccess: (data) => {
      queryClient.setQueryData(['sia-memory', userId], data);
    },
  });

  // Mutation for clearing memory
  const clearMemoryMutation = useMutation({
    mutationFn: () => siaMemoryService.clearMemory(userId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sia-memory', userId] });
    },
  });

  // Mutation for removing a fact
  const removeFactMutation = useMutation({
    mutationFn: (factId: string) =>
      siaMemoryService.removeFact(userId!, factId),
    onSuccess: (data) => {
      queryClient.setQueryData(['sia-memory', userId], data);
    },
  });

  // Mutation for updating personality
  const updatePersonalityMutation = useMutation({
    mutationFn: (adjustments: Record<string, unknown>) =>
      siaMemoryService.updatePersonality(userId!, adjustments),
    onSuccess: (data) => {
      queryClient.setQueryData(['sia-memory', userId], data);
    },
  });

  // Mutation for updating preferences
  const updatePreferencesMutation = useMutation({
    mutationFn: (preferences: Record<string, unknown>) =>
      siaMemoryService.updatePreferences(userId!, preferences),
    onSuccess: (data) => {
      queryClient.setQueryData(['sia-memory', userId], data);
    },
  });

  return {
    // Data
    memory,
    isLoading,
    error,

    // Actions
    updateMemory: updateMemoryMutation.mutate,
    updateMemoryAsync: updateMemoryMutation.mutateAsync,
    updateSummary: updateSummaryMutation.mutate,
    updateSummaryAsync: updateSummaryMutation.mutateAsync,
    clearMemory: clearMemoryMutation.mutate,
    clearMemoryAsync: clearMemoryMutation.mutateAsync,
    removeFact: removeFactMutation.mutate,
    removeFactAsync: removeFactMutation.mutateAsync,
    updatePersonality: updatePersonalityMutation.mutate,
    updatePersonalityAsync: updatePersonalityMutation.mutateAsync,
    updatePreferences: updatePreferencesMutation.mutate,
    updatePreferencesAsync: updatePreferencesMutation.mutateAsync,
    refetch,

    // Loading states
    isUpdating: updateMemoryMutation.isPending,
    isClearing: clearMemoryMutation.isPending,
    isRemovingFact: removeFactMutation.isPending,
    isUpdatingPersonality: updatePersonalityMutation.isPending,
    isUpdatingPreferences: updatePreferencesMutation.isPending,
  };
}

/**
 * Hook for getting memory summary
 */
export function useSiaMemorySummary(userId: string | undefined) {
  return useQuery({
    queryKey: ['sia-memory-summary', userId],
    queryFn: () => siaMemoryService.getMemorySummary(userId!),
    enabled: Boolean(userId),
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

/**
 * Hook for getting facts by category
 */
export function useSiaFactsByCategory(
  userId: string | undefined,
  category: SiaFact['category']
) {
  return useQuery({
    queryKey: ['sia-facts', userId, category],
    queryFn: () => siaMemoryService.getFactsByCategory(userId!, category),
    enabled: Boolean(userId),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook for getting user preferences
 */
export function useSiaPreferences(userId: string | undefined) {
  return useQuery({
    queryKey: ['sia-preferences', userId],
    queryFn: () => siaMemoryService.getPreferences(userId!),
    enabled: Boolean(userId),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook for getting recent topics
 */
export function useSiaRecentTopics(userId: string | undefined) {
  return useQuery({
    queryKey: ['sia-topics', userId],
    queryFn: () => siaMemoryService.getRecentTopics(userId!),
    enabled: Boolean(userId),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook for getting interaction statistics
 */
export function useSiaInteractionStats(userId: string | undefined) {
  return useQuery({
    queryKey: ['sia-stats', userId],
    queryFn: () => siaMemoryService.getInteractionStats(userId!),
    enabled: Boolean(userId),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
