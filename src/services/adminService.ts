import { supabase } from '@/integrations/supabase';
import { logger } from '@/lib/logger';
import type {
  UserRole,
  PromptFeed,
  PromptFeedInsert,
  PromptFeedUpdate,
  AutomationTemplate,
  AutomationTemplateInsert,
  AutomationTemplateUpdate,
  User,
} from '@/integrations/supabase';

// Re-export types for convenience
export type { UserRole, PromptFeed, AutomationTemplate };

export interface UserRoleRecord {
  id: string;
  user_id: string;
  role: 'admin' | 'employee';
  created_at: string;
  updated_at: string;
}

export interface UserWithRole extends User {
  role: 'admin' | 'employee';
}

class AdminService {
  /**
   * Get the role for a specific user.
   * Returns 'employee' as default if no role is found.
   */
  async getUserRole(userId: string): Promise<'admin' | 'employee'> {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      return 'employee';
    }

    return data.role;
  }

  /**
   * Check if a user is an admin.
   * Uses the is_oneedge_admin RPC function.
   */
  async isAdmin(userId: string): Promise<boolean> {
    const { data, error } = await supabase
      .rpc('is_oneedge_admin', { check_user_id: userId });

    if (error) {
      logger.error('Failed to check admin status', error);
      return false;
    }

    return data ?? false;
  }

  /**
   * Set or update a user's role.
   * Admin only via RLS.
   */
  async setUserRole(userId: string, role: 'admin' | 'employee'): Promise<UserRoleRecord> {
    const { data, error } = await supabase
      .from('user_roles')
      .upsert({
        user_id: userId,
        role,
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to set user role', error);
      throw new Error(`Failed to set user role: ${error.message}`);
    }

    return data;
  }

  // ========================================================================
  // Prompt Feeds Management (Admin only)
  // ========================================================================

  /**
   * Get all prompt feeds.
   * RLS allows admins to see all, employees see only active.
   */
  async getPromptFeeds(): Promise<PromptFeed[]> {
    const { data, error } = await supabase
      .from('prompt_feeds')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Failed to fetch prompt feeds', error);
      throw new Error(`Failed to fetch prompt feeds: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Create a new prompt feed.
   * Admin only via RLS.
   */
  async createPromptFeed(
    feed: PromptFeedInsert
  ): Promise<PromptFeed> {
    const { data, error } = await supabase
      .from('prompt_feeds')
      .insert(feed)
      .select()
      .single();

    if (error) {
      logger.error('Failed to create prompt feed', error);
      throw new Error(`Failed to create prompt feed: ${error.message}`);
    }

    return data;
  }

  /**
   * Update an existing prompt feed.
   * Admin only via RLS.
   */
  async updatePromptFeed(
    feedId: string,
    updates: PromptFeedUpdate
  ): Promise<PromptFeed> {
    const { data, error } = await supabase
      .from('prompt_feeds')
      .update(updates)
      .eq('id', feedId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update prompt feed', error);
      throw new Error(`Failed to update prompt feed: ${error.message}`);
    }

    return data;
  }

  /**
   * Delete a prompt feed.
   * Admin only via RLS. Also deletes associated external_prompts.
   */
  async deletePromptFeed(feedId: string): Promise<void> {
    const { error } = await supabase
      .from('prompt_feeds')
      .delete()
      .eq('id', feedId);

    if (error) {
      logger.error('Failed to delete prompt feed', error);
      throw new Error(`Failed to delete prompt feed: ${error.message}`);
    }
  }

  // ========================================================================
  // Automation Templates Management (Admin only)
  // ========================================================================

  /**
   * Get all automation templates.
   * RLS allows admins to see all, employees see only active.
   */
  async getAutomationTemplates(): Promise<AutomationTemplate[]> {
    const { data, error } = await supabase
      .from('automation_templates')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Failed to fetch automation templates', error);
      throw new Error(`Failed to fetch automation templates: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get active automation templates only.
   * Used by employees to see available templates.
   */
  async getActiveTemplates(): Promise<AutomationTemplate[]> {
    const { data, error } = await supabase
      .from('automation_templates')
      .select('*')
      .eq('is_active', true)
      .order('usage_count', { ascending: false });

    if (error) {
      logger.error('Failed to fetch active templates', error);
      throw new Error(`Failed to fetch templates: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Create a new automation template.
   * Admin only via RLS.
   */
  async createAutomationTemplate(
    template: AutomationTemplateInsert
  ): Promise<AutomationTemplate> {
    const { data, error } = await supabase
      .from('automation_templates')
      .insert(template)
      .select()
      .single();

    if (error) {
      logger.error('Failed to create automation template', error);
      throw new Error(`Failed to create automation template: ${error.message}`);
    }

    return data;
  }

  /**
   * Update an existing automation template.
   * Admin only via RLS.
   */
  async updateAutomationTemplate(
    templateId: string,
    updates: AutomationTemplateUpdate
  ): Promise<AutomationTemplate> {
    const { data, error } = await supabase
      .from('automation_templates')
      .update(updates)
      .eq('id', templateId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update automation template', error);
      throw new Error(`Failed to update automation template: ${error.message}`);
    }

    return data;
  }

  /**
   * Delete an automation template.
   * Admin only via RLS.
   */
  async deleteAutomationTemplate(templateId: string): Promise<void> {
    const { error } = await supabase
      .from('automation_templates')
      .delete()
      .eq('id', templateId);

    if (error) {
      logger.error('Failed to delete automation template', error);
      throw new Error(`Failed to delete automation template: ${error.message}`);
    }
  }

  /**
   * Increment usage count for a template when used.
   */
  async incrementTemplateUsage(templateId: string): Promise<void> {
    const { error } = await supabase
      .rpc('increment_template_usage', { template_id: templateId });

    if (error) {
      logger.error('Failed to increment template usage', error);
    }
  }

  // ========================================================================
  // User Management (Admin only)
  // ========================================================================

  /**
   * Get all users with their roles.
   * Admin only.
   */
  async getUsers(): Promise<UserWithRole[]> {
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (usersError) {
      logger.error('Failed to fetch users', usersError);
      throw new Error(`Failed to fetch users: ${usersError.message}`);
    }

    const { data: roles, error: rolesError } = await supabase
      .from('user_roles')
      .select('user_id, role');

    if (rolesError) {
      logger.error('Failed to fetch user roles', rolesError);
    }

    const roleMap = new Map(
      (roles || []).map((r) => [r.user_id, r.role])
    );

    return (users || []).map((user) => ({
      ...user,
      role: roleMap.get(user.id) || 'employee',
    }));
  }
}

export const adminService = new AdminService();
