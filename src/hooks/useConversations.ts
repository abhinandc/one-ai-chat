import { useState, useEffect } from 'react';
import { conversationService, StoredConversation } from '../services/conversationService';

export function useConversations(userEmail?: string) {
  const [conversations, setConversations] = useState<StoredConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConversations = async () => {
    if (!userEmail) {
      setConversations([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Migrate localStorage data if exists
      await conversationService.migrateLocalStorageConversations(userEmail);
      
      // Fetch from Supabase
      const data = await conversationService.getConversations(userEmail);
      setConversations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch conversations');
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, [userEmail]);

  const saveConversation = async (conversation: Omit<StoredConversation, 'created_at' | 'updated_at'>): Promise<StoredConversation> => {
    if (!userEmail) throw new Error('User email required');
    
    const saved = await conversationService.saveConversation(conversation);
    await fetchConversations(); // Refresh list
    return saved;
  };

  const deleteConversation = async (id: string): Promise<void> => {
    if (!userEmail) throw new Error('User email required');
    
    await conversationService.deleteConversation(id, userEmail);
    await fetchConversations(); // Refresh list
  };

  const updateConversation = async (id: string, updates: Partial<StoredConversation>): Promise<StoredConversation> => {
    if (!userEmail) throw new Error('User email required');
    
    const updated = await conversationService.updateConversation(id, userEmail, updates);
    await fetchConversations(); // Refresh list
    return updated;
  };

  return {
    conversations,
    loading,
    error,
    saveConversation,
    deleteConversation,
    updateConversation,
    refetch: fetchConversations,
  };
}
