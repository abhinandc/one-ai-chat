import supabaseClient from './supabaseClient';

export interface StoredConversation {
  id: string;
  user_email: string;
  title: string;
  messages: any[];
  folder_id?: string;
  pinned: boolean;
  shared: boolean;
  unread: boolean;
  tags: string[];
  settings: any;
  created_at: string;
  updated_at: string;
}

export interface ConversationFolder {
  id: string;
  user_email: string;
  name: string;
  color: string;
  created_at: string;
}

class ConversationService {
  async getConversations(userEmail: string): Promise<StoredConversation[]> {
    const { data, error } = await supabaseClient
      .from('conversations')
      .select('*')
      .eq('user_email', userEmail)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async saveConversation(conversation: Omit<StoredConversation, 'created_at' | 'updated_at'>): Promise<StoredConversation> {
    const { data, error } = await supabaseClient
      .from('conversations')
      .upsert({
        ...conversation,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteConversation(id: string, userEmail: string): Promise<void> {
    const { error } = await supabaseClient
      .from('conversations')
      .delete()
      .eq('id', id)
      .eq('user_email', userEmail);

    if (error) throw error;
  }

  async getFolders(userEmail: string): Promise<ConversationFolder[]> {
    const { data, error } = await supabaseClient
      .from('conversation_folders')
      .select('*')
      .eq('user_email', userEmail)
      .order('name');

    if (error) throw error;
    return data || [];
  }

  async createFolder(name: string, color: string, userEmail: string): Promise<ConversationFolder> {
    const { data, error } = await supabaseClient
      .from('conversation_folders')
      .insert({
        user_email: userEmail,
        name,
        color
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateConversation(id: string, userEmail: string, updates: Partial<StoredConversation>): Promise<StoredConversation> {
    const { data, error } = await supabaseClient
      .from('conversations')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_email', userEmail)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Migrate localStorage conversations to Supabase
  async migrateLocalStorageConversations(userEmail: string): Promise<void> {
    try {
      const storageKey = `oneai.chat.${userEmail}`;
      const localData = localStorage.getItem(storageKey);
      
      if (!localData) return;
      
      const parsed = JSON.parse(localData);
      const conversations = parsed.conversations || [];
      
      for (const conv of conversations) {
        await this.saveConversation({
          id: conv.id,
          user_email: userEmail,
          title: conv.title,
          messages: conv.messages,
          folder_id: conv.folderId,
          pinned: conv.pinned,
          shared: conv.shared,
          unread: conv.unread,
          tags: conv.tags,
          settings: conv.settings
        });
      }
      
      // Clear localStorage after successful migration
      localStorage.removeItem(storageKey);
      console.log('Successfully migrated conversations to Supabase');
    } catch (error) {
      console.error('Failed to migrate conversations:', error);
    }
  }
}

export const conversationService = new ConversationService();
