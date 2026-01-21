import supabaseClient from './supabaseClient';

export interface AIGalleryRequest {
  id: string;
  user_email: string;
  request_type: 'model' | 'tool';
  name: string;
  description: string;
  justification: string;
  use_case: string | null;
  urgency: 'low' | 'normal' | 'high' | 'critical';
  team_impact: string | null;
  estimated_usage: string | null;
  alternatives_considered: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'under_review';
  admin_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  upvotes: number;
  created_at: string;
  updated_at: string;
  user_has_upvoted?: boolean;
  is_own_request?: boolean;
}

export interface NewRequestData {
  request_type: 'model' | 'tool';
  name: string;
  description: string;
  justification: string;
  use_case?: string;
  urgency?: 'low' | 'normal' | 'high' | 'critical';
  team_impact?: string;
  estimated_usage?: string;
  alternatives_considered?: string;
}

class AIGalleryService {
  /**
   * Get AI gallery requests with filters
   */
  async getRequests(
    userEmail: string,
    options?: {
      requestType?: 'model' | 'tool';
      status?: 'pending' | 'approved' | 'rejected' | 'under_review';
      limit?: number;
      offset?: number;
    }
  ): Promise<AIGalleryRequest[]> {
    if (!supabaseClient) {
      console.warn('AIGalleryService: Supabase client not configured');
      return [];
    }

    const { data, error } = await supabaseClient.rpc('get_ai_gallery_requests', {
      p_user_email: userEmail,
      p_request_type: options?.requestType || null,
      p_status: options?.status || null,
      p_limit: options?.limit || 50,
      p_offset: options?.offset || 0
    });

    if (error) {
      console.error('Error fetching AI gallery requests:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Submit a new request
   */
  async submitRequest(
    userEmail: string,
    requestData: NewRequestData
  ): Promise<string | null> {
    if (!supabaseClient) {
      console.warn('AIGalleryService: Supabase client not configured');
      return null;
    }

    const { data, error } = await supabaseClient.rpc('submit_ai_gallery_request', {
      p_user_email: userEmail,
      p_request_type: requestData.request_type,
      p_name: requestData.name,
      p_description: requestData.description,
      p_justification: requestData.justification,
      p_use_case: requestData.use_case || null,
      p_urgency: requestData.urgency || 'normal',
      p_team_impact: requestData.team_impact || null,
      p_estimated_usage: requestData.estimated_usage || null,
      p_alternatives: requestData.alternatives_considered || null
    });

    if (error) {
      console.error('Error submitting request:', error);
      return null;
    }

    return data as string;
  }

  /**
   * Toggle upvote on a request
   */
  async toggleUpvote(
    requestId: string,
    userEmail: string
  ): Promise<number | null> {
    if (!supabaseClient) {
      return null;
    }

    const { data, error } = await supabaseClient.rpc('upvote_request', {
      p_request_id: requestId,
      p_user_email: userEmail
    });

    if (error) {
      console.error('Error toggling upvote:', error);
      return null;
    }

    return data as number;
  }

  /**
   * Update a pending request (own request only)
   */
  async updateRequest(
    userEmail: string,
    requestId: string,
    updates: Partial<NewRequestData>
  ): Promise<boolean> {
    if (!supabaseClient) {
      return false;
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString()
    };

    if (updates.name) updateData.name = updates.name;
    if (updates.description) updateData.description = updates.description;
    if (updates.justification) updateData.justification = updates.justification;
    if (updates.use_case !== undefined) updateData.use_case = updates.use_case;
    if (updates.urgency) updateData.urgency = updates.urgency;
    if (updates.team_impact !== undefined) updateData.team_impact = updates.team_impact;
    if (updates.estimated_usage !== undefined) updateData.estimated_usage = updates.estimated_usage;
    if (updates.alternatives_considered !== undefined) updateData.alternatives_considered = updates.alternatives_considered;

    const { error } = await supabaseClient
      .from('ai_gallery_requests')
      .update(updateData)
      .eq('id', requestId)
      .eq('user_email', userEmail)
      .eq('status', 'pending');

    if (error) {
      console.error('Error updating request:', error);
      return false;
    }

    return true;
  }

  /**
   * Delete a pending request (own request only)
   */
  async deleteRequest(userEmail: string, requestId: string): Promise<boolean> {
    if (!supabaseClient) {
      return false;
    }

    const { error } = await supabaseClient
      .from('ai_gallery_requests')
      .delete()
      .eq('id', requestId)
      .eq('user_email', userEmail)
      .eq('status', 'pending');

    if (error) {
      console.error('Error deleting request:', error);
      return false;
    }

    return true;
  }

  /**
   * Get my requests only
   */
  async getMyRequests(
    userEmail: string,
    options?: { limit?: number; offset?: number }
  ): Promise<AIGalleryRequest[]> {
    if (!supabaseClient) {
      return [];
    }

    const { data, error } = await supabaseClient
      .from('ai_gallery_requests')
      .select('*')
      .eq('user_email', userEmail)
      .order('created_at', { ascending: false })
      .limit(options?.limit || 50)
      .range(options?.offset || 0, (options?.offset || 0) + (options?.limit || 50) - 1);

    if (error) {
      console.error('Error fetching my requests:', error);
      return [];
    }

    return (data || []).map(r => ({
      ...r,
      is_own_request: true,
      user_has_upvoted: false
    }));
  }

  /**
   * Admin: Review a request (approve/reject)
   */
  async reviewRequest(
    adminEmail: string,
    requestId: string,
    status: 'approved' | 'rejected' | 'under_review',
    adminNotes?: string
  ): Promise<boolean> {
    if (!supabaseClient) {
      return false;
    }

    const { data, error } = await supabaseClient.rpc('review_ai_gallery_request', {
      p_request_id: requestId,
      p_admin_email: adminEmail,
      p_status: status,
      p_admin_notes: adminNotes || null
    });

    if (error) {
      console.error('Error reviewing request:', error);
      return false;
    }

    return data as boolean;
  }

  /**
   * Check if user is admin
   */
  async isAdmin(userEmail: string): Promise<boolean> {
    if (!supabaseClient) {
      return false;
    }

    const { data, error } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_email', userEmail)
      .single();

    if (error) {
      // No role entry means not an admin
      return false;
    }

    return data?.role === 'admin';
  }
}

export const aiGalleryService = new AIGalleryService();
