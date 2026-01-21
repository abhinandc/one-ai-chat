import supabaseClient from './supabaseClient';

export type TemplateCategory = 'gsuite' | 'slack' | 'jira' | 'github' | 'crm' | 'productivity' | 'communication' | 'custom';
export type TriggerType = 'schedule' | 'webhook' | 'email' | 'event' | 'manual' | 'ai_trigger';
export type ActionType = 'ai_process' | 'send_email' | 'post_message' | 'create_doc' | 'update_record' | 'api_call' | 'multi_step';
export type Complexity = 'simple' | 'medium' | 'advanced';

export interface AutomationTemplate {
  id: string;
  name: string;
  description: string | null;
  category: TemplateCategory;
  subcategory: string | null;
  trigger_type: TriggerType;
  trigger_config: Record<string, unknown>;
  action_type: ActionType;
  action_config: Record<string, unknown>;
  ai_model: string | null;
  required_credentials: string[];
  icon: string | null;
  color: string | null;
  complexity: Complexity;
  use_count: number;
  is_featured: boolean;
}

export interface NewTemplateData {
  name: string;
  description?: string;
  category: TemplateCategory;
  subcategory?: string;
  trigger_type: TriggerType;
  trigger_config?: Record<string, unknown>;
  action_type: ActionType;
  action_config?: Record<string, unknown>;
  ai_model?: string;
  required_credentials?: string[];
  icon?: string;
  color?: string;
  complexity?: Complexity;
  is_featured?: boolean;
}

// Category metadata for UI display
export const CATEGORY_INFO: Record<TemplateCategory, {
  name: string;
  description: string;
  icon: string;
  color: string;
}> = {
  gsuite: { name: 'Google Workspace', description: 'Gmail, Calendar, Drive, Sheets', icon: 'mail', color: '#4285F4' },
  slack: { name: 'Slack', description: 'Messages and notifications', icon: 'hash', color: '#4A154B' },
  jira: { name: 'Jira', description: 'Issue tracking and projects', icon: 'briefcase', color: '#0052CC' },
  github: { name: 'GitHub', description: 'Repositories and PRs', icon: 'github', color: '#24292e' },
  crm: { name: 'CRM', description: 'Customer relationship management', icon: 'users', color: '#00A1E0' },
  productivity: { name: 'Productivity', description: 'Task and time management', icon: 'check-square', color: '#10B981' },
  communication: { name: 'Communication', description: 'Email and messaging', icon: 'message-circle', color: '#8B5CF6' },
  custom: { name: 'Custom', description: 'Custom automations', icon: 'code', color: '#6B7280' }
};

class AutomationTemplatesService {
  /**
   * Get automation templates
   */
  async getTemplates(
    options?: {
      category?: TemplateCategory;
      featuredOnly?: boolean;
      limit?: number;
    }
  ): Promise<AutomationTemplate[]> {
    if (!supabaseClient) {
      console.warn('AutomationTemplatesService: Supabase client not configured');
      return [];
    }

    const { data, error } = await supabaseClient.rpc('get_automation_templates', {
      p_category: options?.category || null,
      p_featured_only: options?.featuredOnly || false,
      p_limit: options?.limit || 50
    });

    if (error) {
      console.error('Error fetching automation templates:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Get a single template by ID
   */
  async getTemplate(templateId: string): Promise<AutomationTemplate | null> {
    if (!supabaseClient) {
      return null;
    }

    const { data, error } = await supabaseClient
      .from('automation_templates')
      .select('*')
      .eq('id', templateId)
      .eq('is_active', true)
      .single();

    if (error) {
      console.error('Error fetching template:', error);
      return null;
    }

    return data;
  }

  /**
   * Record template use
   */
  async recordUse(templateId: string): Promise<boolean> {
    if (!supabaseClient) {
      return false;
    }

    const { error } = await supabaseClient.rpc('use_automation_template', {
      p_template_id: templateId
    });

    if (error) {
      console.error('Error recording template use:', error);
      return false;
    }

    return true;
  }

  /**
   * Create a new template (admin only)
   */
  async createTemplate(
    adminEmail: string,
    templateData: NewTemplateData
  ): Promise<string | null> {
    if (!supabaseClient) {
      return null;
    }

    const { data, error } = await supabaseClient
      .from('automation_templates')
      .insert({
        name: templateData.name,
        description: templateData.description || null,
        category: templateData.category,
        subcategory: templateData.subcategory || null,
        trigger_type: templateData.trigger_type,
        trigger_config: templateData.trigger_config || {},
        action_type: templateData.action_type,
        action_config: templateData.action_config || {},
        ai_model: templateData.ai_model || null,
        required_credentials: templateData.required_credentials || [],
        icon: templateData.icon || null,
        color: templateData.color || null,
        complexity: templateData.complexity || 'simple',
        is_featured: templateData.is_featured || false,
        created_by: adminEmail
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error creating template:', error);
      return null;
    }

    return data?.id;
  }

  /**
   * Update a template (admin only)
   */
  async updateTemplate(
    templateId: string,
    updates: Partial<NewTemplateData>
  ): Promise<boolean> {
    if (!supabaseClient) {
      return false;
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString()
    };

    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.category !== undefined) updateData.category = updates.category;
    if (updates.subcategory !== undefined) updateData.subcategory = updates.subcategory;
    if (updates.trigger_type !== undefined) updateData.trigger_type = updates.trigger_type;
    if (updates.trigger_config !== undefined) updateData.trigger_config = updates.trigger_config;
    if (updates.action_type !== undefined) updateData.action_type = updates.action_type;
    if (updates.action_config !== undefined) updateData.action_config = updates.action_config;
    if (updates.ai_model !== undefined) updateData.ai_model = updates.ai_model;
    if (updates.required_credentials !== undefined) updateData.required_credentials = updates.required_credentials;
    if (updates.icon !== undefined) updateData.icon = updates.icon;
    if (updates.color !== undefined) updateData.color = updates.color;
    if (updates.complexity !== undefined) updateData.complexity = updates.complexity;
    if (updates.is_featured !== undefined) updateData.is_featured = updates.is_featured;

    const { error } = await supabaseClient
      .from('automation_templates')
      .update(updateData)
      .eq('id', templateId);

    if (error) {
      console.error('Error updating template:', error);
      return false;
    }

    return true;
  }

  /**
   * Delete a template (admin only)
   */
  async deleteTemplate(templateId: string): Promise<boolean> {
    if (!supabaseClient) {
      return false;
    }

    // Soft delete by setting is_active to false
    const { error } = await supabaseClient
      .from('automation_templates')
      .update({
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', templateId);

    if (error) {
      console.error('Error deleting template:', error);
      return false;
    }

    return true;
  }

  /**
   * Get templates by required credential type
   */
  async getTemplatesByCredential(credentialType: string): Promise<AutomationTemplate[]> {
    if (!supabaseClient) {
      return [];
    }

    const { data, error } = await supabaseClient
      .from('automation_templates')
      .select('*')
      .eq('is_active', true)
      .contains('required_credentials', [credentialType])
      .order('use_count', { ascending: false });

    if (error) {
      console.error('Error fetching templates by credential:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Search templates
   */
  async searchTemplates(query: string, limit = 20): Promise<AutomationTemplate[]> {
    if (!supabaseClient) {
      return [];
    }

    const { data, error } = await supabaseClient
      .from('automation_templates')
      .select('*')
      .eq('is_active', true)
      .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
      .order('is_featured', { ascending: false })
      .order('use_count', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error searching templates:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Get featured templates
   */
  async getFeaturedTemplates(limit = 6): Promise<AutomationTemplate[]> {
    return this.getTemplates({ featuredOnly: true, limit });
  }

  /**
   * Get templates grouped by category
   */
  async getTemplatesGroupedByCategory(): Promise<Record<TemplateCategory, AutomationTemplate[]>> {
    const templates = await this.getTemplates({ limit: 100 });

    const grouped: Record<TemplateCategory, AutomationTemplate[]> = {
      gsuite: [],
      slack: [],
      jira: [],
      github: [],
      crm: [],
      productivity: [],
      communication: [],
      custom: []
    };

    templates.forEach(template => {
      if (grouped[template.category]) {
        grouped[template.category].push(template);
      }
    });

    return grouped;
  }
}

export const automationTemplatesService = new AutomationTemplatesService();
