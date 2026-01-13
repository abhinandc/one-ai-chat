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
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect to N8N';
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError') || errorMessage.includes('CORS')) {
        return { 
          success: false, 
          error: 'Could not reach N8N server. This may be due to CORS restrictions. Ensure your N8N instance allows requests from this domain, or check that the URL is correct.' 
        };
      }
      return { 
        success: false, 
        error: errorMessage 
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

  /**
   * Test a workflow's webhook trigger
   * Sends a test payload to the workflow's webhook endpoint
   */
  async testWorkflowWebhook(
    workflowId: string,
    testPayload?: Record<string, any>
  ): Promise<{ success: boolean; response?: any; error?: string }> {
    const credentials = this.getCredentials();
    if (!credentials) {
      return { success: false, error: 'N8N credentials not configured' };
    }

    try {
      // Get workflow details to find webhook path
      const workflow = await this.getWorkflow(workflowId);

      // Find webhook node in workflow
      const webhookNode = workflow.nodes?.find(
        (node) => node.type === 'n8n-nodes-base.webhook' || node.type.includes('webhook')
      );

      if (!webhookNode) {
        return {
          success: false,
          error: 'No webhook trigger found in workflow',
        };
      }

      // Get webhook path from node parameters
      const webhookPath = (webhookNode.parameters as any)?.path || 'test';

      // Build webhook URL
      let baseUrl = credentials.url.trim();
      if (baseUrl.endsWith('/')) {
        baseUrl = baseUrl.slice(0, -1);
      }
      if (baseUrl.includes('/api/v1')) {
        baseUrl = baseUrl.replace('/api/v1', '');
      }

      const webhookUrl = `${baseUrl}/webhook-test/${webhookPath}`;

      // Send test payload
      const payload = testPayload || {
        test: true,
        timestamp: new Date().toISOString(),
        message: 'Test webhook trigger from OneEdge',
      };

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        return {
          success: false,
          error: `Webhook test failed: ${response.statusText}`,
        };
      }

      const responseData = await response.json().catch(() => null);

      return {
        success: true,
        response: responseData,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to test webhook',
      };
    }
  }

  /**
   * Execute a workflow manually (for workflows without webhook triggers)
   */
  async executeWorkflow(
    workflowId: string,
    inputData?: Record<string, any>
  ): Promise<{ success: boolean; executionId?: string; error?: string }> {
    const credentials = this.getCredentials();
    if (!credentials) {
      return { success: false, error: 'N8N credentials not configured' };
    }

    try {
      const apiUrl = this.getApiUrl(credentials);
      const response = await fetch(`${apiUrl}/workflows/${workflowId}/execute`, {
        method: 'POST',
        headers: {
          'X-N8N-API-KEY': credentials.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(inputData || {}),
      });

      if (!response.ok) {
        return {
          success: false,
          error: `Workflow execution failed: ${response.statusText}`,
        };
      }

      const data = await response.json();
      return {
        success: true,
        executionId: data.id || data.executionId,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to execute workflow',
      };
    }
  }

  /**
   * Get workflow execution results
   */
  async getExecutionResult(executionId: string): Promise<{ success: boolean; data?: any; error?: string }> {
    const credentials = this.getCredentials();
    if (!credentials) {
      return { success: false, error: 'N8N credentials not configured' };
    }

    try {
      const apiUrl = this.getApiUrl(credentials);
      const response = await fetch(`${apiUrl}/executions/${executionId}`, {
        method: 'GET',
        headers: {
          'X-N8N-API-KEY': credentials.apiKey,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        return {
          success: false,
          error: `Failed to get execution result: ${response.statusText}`,
        };
      }

      const data = await response.json();
      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get execution result',
      };
    }
  }
}

export const n8nService = new N8NService();
