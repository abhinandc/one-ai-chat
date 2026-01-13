import { supabase } from '@/integrations/supabase';
import { logger } from '@/lib/logger';
import type {
  Conversation,
  ConversationFolder,
  Json,
} from '@/integrations/supabase/types';

// Re-export types for convenience
export type { Conversation, ConversationFolder };

// Legacy alias for backward compatibility
export type StoredConversation = Conversation;

class ConversationService {
  /**
   * Get all conversations for a user.
   */
  async getConversations(userEmail: string): Promise<Conversation[]> {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_email', userEmail)
      .order('updated_at', { ascending: false });

    if (error) {
      logger.error('Failed to fetch conversations', error);
      throw new Error(`Failed to fetch conversations: ${error.message}`);
    }
    return data || [];
  }

  /**
   * Save or update a conversation.
   */
  async saveConversation(
    conversation: Omit<Conversation, 'created_at' | 'updated_at'>
  ): Promise<Conversation> {
    const { data, error } = await supabase
      .from('conversations')
      .upsert({
        ...conversation,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to save conversation', error);
      throw new Error(`Failed to save conversation: ${error.message}`);
    }
    return data;
  }

  /**
   * Delete a conversation.
   */
  async deleteConversation(id: string, userEmail: string): Promise<void> {
    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('id', id)
      .eq('user_email', userEmail);

    if (error) {
      logger.error('Failed to delete conversation', error);
      throw new Error(`Failed to delete conversation: ${error.message}`);
    }
  }

  /**
   * Get all folders for a user.
   */
  async getFolders(userEmail: string): Promise<ConversationFolder[]> {
    const { data, error } = await supabase
      .from('conversation_folders')
      .select('*')
      .eq('user_email', userEmail)
      .order('name');

    if (error) {
      logger.error('Failed to fetch folders', error);
      throw new Error(`Failed to fetch folders: ${error.message}`);
    }
    return data || [];
  }

  /**
   * Create a new folder.
   */
  async createFolder(name: string, color: string, userEmail: string): Promise<ConversationFolder> {
    const { data, error } = await supabase
      .from('conversation_folders')
      .insert({
        user_email: userEmail,
        name,
        color
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to create folder', error);
      throw new Error(`Failed to create folder: ${error.message}`);
    }
    return data;
  }

  /**
   * Update an existing conversation.
   */
  async updateConversation(
    id: string,
    userEmail: string,
    updates: Partial<Conversation>
  ): Promise<Conversation> {
    const { data, error } = await supabase
      .from('conversations')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_email', userEmail)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update conversation', error);
      throw new Error(`Failed to update conversation: ${error.message}`);
    }
    return data;
  }

  /**
   * Delete a folder.
   */
  async deleteFolder(id: string, userEmail: string): Promise<void> {
    const { error } = await supabase
      .from('conversation_folders')
      .delete()
      .eq('id', id)
      .eq('user_email', userEmail);

    if (error) {
      logger.error('Failed to delete folder', error);
      throw new Error(`Failed to delete folder: ${error.message}`);
    }
  }

  /**
   * Migrate localStorage conversations to Supabase.
   * Called once when user first logs in with Supabase auth.
   */
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
          messages: conv.messages as Json,
          folder_id: conv.folderId || null,
          pinned: conv.pinned ?? false,
          shared: conv.shared ?? false,
          unread: conv.unread ?? false,
          tags: conv.tags || [],
          settings: conv.settings as Json || {}
        });
      }

      // Clear localStorage after successful migration
      localStorage.removeItem(storageKey);
      logger.info('Successfully migrated conversations to Supabase');
    } catch (error) {
      logger.error('Failed to migrate conversations', error);
    }
  }

  /**
   * Export conversation as Markdown
   */
  async exportAsMarkdown(conversationId: string, userEmail: string): Promise<string> {
    const { data: conversation, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .eq('user_email', userEmail)
      .single();

    if (error || !conversation) {
      throw new Error('Failed to fetch conversation for export');
    }

    let markdown = `# ${conversation.title}\n\n`;
    markdown += `**Model:** ${conversation.model}\n`;
    markdown += `**Created:** ${new Date(conversation.created_at).toLocaleString()}\n`;
    markdown += `**Updated:** ${new Date(conversation.updated_at).toLocaleString()}\n\n`;
    markdown += `---\n\n`;

    const messages = conversation.messages as Array<{
      role: string;
      content: string;
      timestamp: string;
    }>;

    for (const message of messages) {
      const role = message.role === 'user' ? '👤 User' : '🤖 Assistant';
      const timestamp = new Date(message.timestamp).toLocaleTimeString();
      markdown += `### ${role} (${timestamp})\n\n`;
      markdown += `${message.content}\n\n`;
      markdown += `---\n\n`;
    }

    return markdown;
  }

  /**
   * Export conversation as PDF
   */
  async exportAsPDF(conversationId: string, userEmail: string): Promise<Blob> {
    const { jsPDF } = await import('jspdf');

    const { data: conversation, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .eq('user_email', userEmail)
      .single();

    if (error || !conversation) {
      throw new Error('Failed to fetch conversation for export');
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const lineHeight = 7;
    let y = margin;

    // Helper to add text with word wrap
    const addText = (text: string, fontSize: number, isBold: boolean = false) => {
      doc.setFontSize(fontSize);
      if (isBold) {
        doc.setFont('helvetica', 'bold');
      } else {
        doc.setFont('helvetica', 'normal');
      }

      const lines = doc.splitTextToSize(text, pageWidth - 2 * margin);
      for (const line of lines) {
        if (y + lineHeight > pageHeight - margin) {
          doc.addPage();
          y = margin;
        }
        doc.text(line, margin, y);
        y += lineHeight;
      }
    };

    // Title
    addText(conversation.title, 18, true);
    y += 5;

    // Metadata
    addText(`Model: ${conversation.model}`, 10);
    addText(`Created: ${new Date(conversation.created_at).toLocaleString()}`, 10);
    addText(`Updated: ${new Date(conversation.updated_at).toLocaleString()}`, 10);
    y += 10;

    // Messages
    const messages = conversation.messages as Array<{
      role: string;
      content: string;
      timestamp: string;
    }>;

    for (const message of messages) {
      const role = message.role === 'user' ? 'User' : 'Assistant';
      const timestamp = new Date(message.timestamp).toLocaleTimeString();

      addText(`${role} (${timestamp})`, 12, true);
      y += 2;
      addText(message.content, 10);
      y += 5;
    }

    return doc.output('blob');
  }

  /**
   * Share conversation publicly
   */
  async shareConversation(
    conversationId: string,
    userEmail: string,
    privacy: 'private' | 'link' | 'public' = 'link',
    expiresInDays?: number
  ): Promise<{ shareToken: string; shareUrl: string }> {
    // Get the conversation
    const { data: conversation, error: fetchError } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .eq('user_email', userEmail)
      .single();

    if (fetchError || !conversation) {
      throw new Error('Failed to fetch conversation');
    }

    // Get the user_id
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Generate share token using the database function
    const { data: tokenData, error: tokenError } = await supabase
      .rpc('generate_share_token');

    if (tokenError) {
      throw new Error('Failed to generate share token');
    }

    const shareToken = tokenData as string;

    // Calculate expiration date if provided
    const expiresAt = expiresInDays
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
      : null;

    // Create shared conversation record
    const { data: sharedConv, error: shareError } = await supabase
      .from('shared_conversations')
      .insert({
        conversation_id: conversationId,
        user_id: user.id,
        share_token: shareToken,
        title: conversation.title,
        messages: conversation.messages,
        model: conversation.model,
        settings: conversation.settings || {},
        privacy,
        expires_at: expiresAt,
      })
      .select()
      .single();

    if (shareError) {
      throw new Error(`Failed to share conversation: ${shareError.message}`);
    }

    const shareUrl = `${window.location.origin}/share/${shareToken}`;

    return { shareToken, shareUrl };
  }

  /**
   * Update shared conversation privacy
   */
  async updateSharePrivacy(
    shareToken: string,
    privacy: 'private' | 'link' | 'public'
  ): Promise<void> {
    const { error } = await supabase
      .from('shared_conversations')
      .update({ privacy, updated_at: new Date().toISOString() })
      .eq('share_token', shareToken);

    if (error) {
      throw new Error(`Failed to update privacy: ${error.message}`);
    }
  }

  /**
   * Get shared conversation by token
   */
  async getSharedConversation(shareToken: string): Promise<any> {
    const { data, error } = await supabase
      .from('shared_conversations')
      .select('*')
      .eq('share_token', shareToken)
      .single();

    if (error) {
      throw new Error('Conversation not found or access denied');
    }

    // Check if expired
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      throw new Error('This shared link has expired');
    }

    // Increment view count
    await supabase.rpc('increment_shared_conversation_views', { token: shareToken });

    return data;
  }

  /**
   * Delete shared conversation
   */
  async unshareConversation(shareToken: string): Promise<void> {
    const { error } = await supabase
      .from('shared_conversations')
      .delete()
      .eq('share_token', shareToken);

    if (error) {
      throw new Error(`Failed to unshare conversation: ${error.message}`);
    }
  }

  /**
   * Get all shared conversations for a user
   */
  async getUserSharedConversations(userEmail: string): Promise<any[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('shared_conversations')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch shared conversations: ${error.message}`);
    }

    return data || [];
  }
}

export const conversationService = new ConversationService();
