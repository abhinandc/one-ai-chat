import { apiClient } from './api';
import supabaseClient from './supabaseClient';

export interface PromptTemplate {
  id: string;
  title: string;
  description: string;
  content: string;
  category: string;
  tags: string[];
  author: string;
  isPublic: boolean;
  userEmail: string;
  createdAt: Date;
  updatedAt: Date;
}

class PromptService {
  async getPrompts(userEmail: string): Promise<PromptTemplate[]> {
    try {
      if (!supabaseClient) return this.getLocalPrompts();

      const { data, error } = await supabaseClient
        .from('prompt_templates')
        .select('*')
        .or(`user_email.eq.${userEmail},is_public.eq.true`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map(item => ({
        id: item.id,
        title: item.title,
        description: item.description,
        content: item.content,
        category: item.category,
        tags: item.tags || [],
        author: item.author || 'User',
        isPublic: item.is_public || false,
        userEmail: item.user_email,
        createdAt: new Date(item.created_at),
        updatedAt: new Date(item.updated_at),
      }));
    } catch (error) {
      console.error('Failed to fetch prompts:', error);
      return this.getLocalPrompts();
    }
  }

  private getLocalPrompts(): PromptTemplate[] {
    try {
      const stored = localStorage.getItem('oneai.prompts');
      if (!stored) return [];
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }

  async savePrompt(prompt: Omit<PromptTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<PromptTemplate> {
    const newPrompt: PromptTemplate = {
      ...prompt,
      id: `prompt-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    try {
      if (supabaseClient) {
        await supabaseClient.from('prompt_templates').insert(newPrompt);
      } else {
        const prompts = this.getLocalPrompts();
        prompts.push(newPrompt);
        localStorage.setItem('oneai.prompts', JSON.stringify(prompts));
      }
      return newPrompt;
    } catch (error) {
      console.error('Failed to save prompt:', error);
      throw error;
    }
  }

  async deletePrompt(id: string): Promise<void> {
    try {
      if (supabaseClient) {
        await supabaseClient.from('prompt_templates').delete().eq('id', id);
      } else {
        const prompts = this.getLocalPrompts().filter(p => p.id !== id);
        localStorage.setItem('oneai.prompts', JSON.stringify(prompts));
      }
    } catch (error) {
      console.error('Failed to delete prompt:', error);
      throw error;
    }
  }
}

export const promptService = new PromptService();
