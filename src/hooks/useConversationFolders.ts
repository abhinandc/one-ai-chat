import { useState, useEffect, useCallback } from 'react';
import supabaseClient from '@/services/supabaseClient';
import type { ConversationFolder } from '@/types';
import { logger } from '@/lib/logger';

interface UseConversationFoldersResult {
  folders: ConversationFolder[];
  loading: boolean;
  error: string | null;
  createFolder: (name: string, color?: string) => Promise<ConversationFolder | null>;
  updateFolder: (id: string, updates: Partial<ConversationFolder>) => Promise<boolean>;
  deleteFolder: (id: string) => Promise<boolean>;
  refetch: () => Promise<void>;
}

export function useConversationFolders(userEmail: string | null | undefined): UseConversationFoldersResult {
  const [folders, setFolders] = useState<ConversationFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFolders = useCallback(async () => {
    if (!userEmail || !supabaseClient) {
      setFolders([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabaseClient
        .from('conversation_folders')
        .select('*')
        .eq('user_email', userEmail)
        .order('created_at', { ascending: true });

      if (fetchError) {
        logger.warn('Error fetching conversation folders', { error: fetchError.message });
        setError(fetchError.message);
        setFolders([]);
        return;
      }

      const transformedFolders: ConversationFolder[] = (data || []).map((folder) => ({
        id: folder.id,
        name: folder.name,
        color: folder.color || '#3B82F6',
        conversationIds: folder.conversation_ids || [],
        createdAt: new Date(folder.created_at),
      }));

      setFolders(transformedFolders);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch folders';
      setError(message);
      logger.error('Error fetching conversation folders', err);
    } finally {
      setLoading(false);
    }
  }, [userEmail]);

  useEffect(() => {
    fetchFolders();
  }, [fetchFolders]);

  const createFolder = useCallback(
    async (name: string, color: string = '#3B82F6'): Promise<ConversationFolder | null> => {
      if (!userEmail || !supabaseClient) {
        return null;
      }

      try {
        const newFolder = {
          user_email: userEmail,
          name,
          color,
          conversation_ids: [],
        };

        const { data, error: insertError } = await supabaseClient
          .from('conversation_folders')
          .insert(newFolder)
          .select()
          .single();

        if (insertError) {
          logger.error('Error creating folder', { error: insertError.message });
          setError(insertError.message);
          return null;
        }

        const createdFolder: ConversationFolder = {
          id: data.id,
          name: data.name,
          color: data.color || '#3B82F6',
          conversationIds: data.conversation_ids || [],
          createdAt: new Date(data.created_at),
        };

        setFolders((prev) => [...prev, createdFolder]);
        return createdFolder;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create folder';
        setError(message);
        logger.error('Error creating folder', err);
        return null;
      }
    },
    [userEmail]
  );

  const updateFolder = useCallback(
    async (id: string, updates: Partial<ConversationFolder>): Promise<boolean> => {
      if (!userEmail || !supabaseClient) {
        return false;
      }

      try {
        const dbUpdates: Record<string, unknown> = {};
        if (updates.name !== undefined) dbUpdates.name = updates.name;
        if (updates.color !== undefined) dbUpdates.color = updates.color;
        if (updates.conversationIds !== undefined) dbUpdates.conversation_ids = updates.conversationIds;

        const { error: updateError } = await supabaseClient
          .from('conversation_folders')
          .update(dbUpdates)
          .eq('id', id)
          .eq('user_email', userEmail);

        if (updateError) {
          logger.error('Error updating folder', { error: updateError.message });
          setError(updateError.message);
          return false;
        }

        setFolders((prev) =>
          prev.map((folder) => (folder.id === id ? { ...folder, ...updates } : folder))
        );

        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update folder';
        setError(message);
        logger.error('Error updating folder', err);
        return false;
      }
    },
    [userEmail]
  );

  const deleteFolder = useCallback(
    async (id: string): Promise<boolean> => {
      if (!userEmail || !supabaseClient) {
        return false;
      }

      try {
        const { error: deleteError } = await supabaseClient
          .from('conversation_folders')
          .delete()
          .eq('id', id)
          .eq('user_email', userEmail);

        if (deleteError) {
          logger.error('Error deleting folder', { error: deleteError.message });
          setError(deleteError.message);
          return false;
        }

        setFolders((prev) => prev.filter((folder) => folder.id !== id));
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to delete folder';
        setError(message);
        logger.error('Error deleting folder', err);
        return false;
      }
    },
    [userEmail]
  );

  return {
    folders,
    loading,
    error,
    createFolder,
    updateFolder,
    deleteFolder,
    refetch: fetchFolders,
  };
}
