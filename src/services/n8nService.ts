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

  private getApiUrl(credentials: N8NCredentials): string {
    let url = credentials.url.trim();
    if (url.endsWith('/')) {
      url = url.slice(0, -1);
    }
    if (!url.includes('/api/v1')) {
      url = `${url}/api/v1`;
    }
    return url;
  }

  async testConnection(credentials?: N8NCredentials): Promise<{ success: boolean; error?: string }> {
    const creds = credentials || this.getCredentials();
    if (!creds) {
      return { success: false, error: 'No credentials configured' };
    }

    try {
      const apiUrl = this.getApiUrl(creds);
      const response = await fetch(`${apiUrl}/workflows?limit=1`, {
        method: 'GET',
        headers: {
          'X-N8N-API-KEY': creds.apiKey,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        return { success: true };
      }

      if (response.status === 401) {
        return { success: false, error: 'Invalid API key' };
      }

      return { success: false, error: `Connection failed: ${response.statusText}` };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to connect to N8N' 
      };
    }
  }

  async getWorkflows(): Promise<N8NWorkflow[]> {
    const credentials = this.getCredentials();
    if (!credentials) {
      throw new Error('N8N credentials not configured');
    }

    const apiUrl = this.getApiUrl(credentials);
    const response = await fetch(`${apiUrl}/workflows`, {
      method: 'GET',
      headers: {
        'X-N8N-API-KEY': credentials.apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Invalid N8N API key');
      }
      throw new Error(`Failed to fetch workflows: ${response.statusText}`);
    }

    const data: N8NWorkflowsResponse = await response.json();
    return data.data || [];
  }

  async getWorkflow(id: string): Promise<N8NWorkflow> {
    const credentials = this.getCredentials();
    if (!credentials) {
      throw new Error('N8N credentials not configured');
    }

    const apiUrl = this.getApiUrl(credentials);
    const response = await fetch(`${apiUrl}/workflows/${id}`, {
      method: 'GET',
      headers: {
        'X-N8N-API-KEY': credentials.apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch workflow: ${response.statusText}`);
    }

    return response.json();
  }

  async updateWorkflow(id: string, data: Partial<N8NWorkflow>): Promise<N8NWorkflow> {
    const credentials = this.getCredentials();
    if (!credentials) {
      throw new Error('N8N credentials not configured');
    }

    const apiUrl = this.getApiUrl(credentials);
    const response = await fetch(`${apiUrl}/workflows/${id}`, {
      method: 'PATCH',
      headers: {
        'X-N8N-API-KEY': credentials.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Failed to update workflow: ${response.statusText}`);
    }

    return response.json();
  }

  async activateWorkflow(id: string): Promise<N8NWorkflow> {
    const credentials = this.getCredentials();
    if (!credentials) {
      throw new Error('N8N credentials not configured');
    }

    const apiUrl = this.getApiUrl(credentials);
    const response = await fetch(`${apiUrl}/workflows/${id}/activate`, {
      method: 'POST',
      headers: {
        'X-N8N-API-KEY': credentials.apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to activate workflow: ${response.statusText}`);
    }

    return response.json();
  }

  async deactivateWorkflow(id: string): Promise<N8NWorkflow> {
    const credentials = this.getCredentials();
    if (!credentials) {
      throw new Error('N8N credentials not configured');
    }

    const apiUrl = this.getApiUrl(credentials);
    const response = await fetch(`${apiUrl}/workflows/${id}/deactivate`, {
      method: 'POST',
      headers: {
        'X-N8N-API-KEY': credentials.apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to deactivate workflow: ${response.statusText}`);
    }

    return response.json();
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
