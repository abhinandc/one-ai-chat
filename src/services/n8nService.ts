import { supabase } from '@/integrations/supabase/client';

const N8N_CREDENTIALS_KEY = 'oneedge_n8n_credentials';

export interface N8NCredentials {
  url: string;
  apiKey: string;
}

export interface N8NWorkflow {
  id: string;
  name: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  tags?: Array<{ id: string; name: string }>;
  nodes?: Array<{
    id: string;
    name: string;
    type: string;
    position: [number, number];
    parameters?: Record<string, unknown>;
  }>;
  connections?: Record<string, unknown>;
}

export interface N8NWorkflowsResponse {
  data: N8NWorkflow[];
  nextCursor?: string;
}

export interface N8NExecution {
  id: string;
  workflowId: string;
  finished: boolean;
  mode: string;
  startedAt: string;
  stoppedAt?: string;
  status: 'success' | 'error' | 'waiting' | 'running' | 'canceled';
  data?: {
    resultData?: {
      error?: { message: string };
    };
  };
}

export interface N8NExecutionsResponse {
  data: N8NExecution[];
  nextCursor?: string;
}

class N8NService {
  getCredentials(): N8NCredentials | null {
    try {
      const stored = localStorage.getItem(N8N_CREDENTIALS_KEY);
      if (!stored) return null;
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }

  saveCredentials(credentials: N8NCredentials): void {
    localStorage.setItem(N8N_CREDENTIALS_KEY, JSON.stringify(credentials));
  }

  removeCredentials(): void {
    localStorage.removeItem(N8N_CREDENTIALS_KEY);
  }

  hasCredentials(): boolean {
    const credentials = this.getCredentials();
    return !!(credentials?.url && credentials?.apiKey);
  }

  private async proxyRequest(path: string, method: string = 'GET', body?: unknown): Promise<Response> {
    const credentials = this.getCredentials();
    if (!credentials) {
      throw new Error('N8N credentials not configured');
    }

    const { data: { session } } = await supabase.auth.getSession();
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-n8n-url': credentials.url,
      'x-n8n-api-key': credentials.apiKey,
    };

    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }

    const url = new URL(`${import.meta.env.VITE_SUPABASE_URL || 'https://wvxocxaywjqujhxfpnwn.supabase.co'}/functions/v1/n8n-proxy`);
    url.searchParams.set('path', path);

    const response = await fetch(url.toString(), {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    return response;
  }

  async testConnection(credentials?: N8NCredentials): Promise<{ success: boolean; error?: string }> {
    const creds = credentials || this.getCredentials();
    if (!creds) {
      return { success: false, error: 'No credentials configured' };
    }

    // Temporarily save credentials for the test
    const hadCredentials = this.hasCredentials();
    const oldCredentials = this.getCredentials();
    
    if (credentials) {
      this.saveCredentials(credentials);
    }

    try {
      const response = await this.proxyRequest('/workflows?limit=1');
      
      // Restore old credentials if this was just a test
      if (credentials && !hadCredentials) {
        this.removeCredentials();
      } else if (credentials && oldCredentials) {
        this.saveCredentials(oldCredentials);
      }

      if (response.ok) {
        // Re-save the new credentials on success
        if (credentials) {
          this.saveCredentials(credentials);
        }
        return { success: true };
      }

      const errorData = await response.json().catch(() => ({}));

      if (response.status === 401) {
        return { success: false, error: 'Invalid API key' };
      }

      return { success: false, error: errorData.error || `Connection failed: ${response.statusText}` };
    } catch (error) {
      // Restore old credentials on error
      if (credentials && oldCredentials) {
        this.saveCredentials(oldCredentials);
      } else if (credentials && !hadCredentials) {
        this.removeCredentials();
      }

      const errorMessage = error instanceof Error ? error.message : 'Failed to connect to N8N';
      return { success: false, error: errorMessage };
    }
  }

  async getWorkflows(): Promise<N8NWorkflow[]> {
    const response = await this.proxyRequest('/workflows');

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Invalid N8N API key');
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to fetch workflows: ${response.statusText}`);
    }

    const data: N8NWorkflowsResponse = await response.json();
    return data.data || [];
  }

  async getWorkflow(id: string): Promise<N8NWorkflow> {
    const response = await this.proxyRequest(`/workflows/${id}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch workflow: ${response.statusText}`);
    }

    return response.json();
  }

  async updateWorkflow(id: string, data: Partial<N8NWorkflow>): Promise<N8NWorkflow> {
    const response = await this.proxyRequest(`/workflows/${id}`, 'PATCH', data);

    if (!response.ok) {
      throw new Error(`Failed to update workflow: ${response.statusText}`);
    }

    return response.json();
  }

  async activateWorkflow(id: string): Promise<N8NWorkflow> {
    const response = await this.proxyRequest(`/workflows/${id}/activate`, 'POST');

    if (!response.ok) {
      throw new Error(`Failed to activate workflow: ${response.statusText}`);
    }

    return response.json();
  }

  async deactivateWorkflow(id: string): Promise<N8NWorkflow> {
    const response = await this.proxyRequest(`/workflows/${id}/deactivate`, 'POST');

    if (!response.ok) {
      throw new Error(`Failed to deactivate workflow: ${response.statusText}`);
    }

    return response.json();
  }

  async getExecutions(workflowId?: string, limit: number = 20): Promise<N8NExecution[]> {
    const path = workflowId 
      ? `/executions?workflowId=${workflowId}&limit=${limit}`
      : `/executions?limit=${limit}`;
    
    const response = await this.proxyRequest(path);

    if (!response.ok) {
      throw new Error(`Failed to fetch executions: ${response.statusText}`);
    }

    const data: N8NExecutionsResponse = await response.json();
    return data.data || [];
  }

  getN8NEditorUrl(workflowId: string): string | null {
    const credentials = this.getCredentials();
    if (!credentials) return null;
    
    let baseUrl = credentials.url.trim();
    if (baseUrl.endsWith('/')) {
      baseUrl = baseUrl.slice(0, -1);
    }
    if (baseUrl.includes('/api/v1')) {
      baseUrl = baseUrl.replace('/api/v1', '');
    }
    
    return `${baseUrl}/workflow/${workflowId}`;
  }
}

export const n8nService = new N8NService();
