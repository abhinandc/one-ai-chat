import { supabase } from '@/integrations/supabase';
import { logger } from '@/lib/logger';
import type {
  AIGalleryRequest,
  AIGalleryRequestInsert,
  AIGalleryRequestUpdate,
  RequestType,
  RequestStatus,
} from '@/integrations/supabase';

// Re-export types for convenience
export type { AIGalleryRequest, RequestType, RequestStatus };

export interface CreateAIGalleryRequest {
  request_type: RequestType;
  name: string;
  description: string;
  justification?: string;
  use_case?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
}

class AIGalleryService {
  /**
   * Get all requests for a specific user.
   * RLS policy ensures user can only see their own requests.
   */
  async getRequests(userId: string): Promise<AIGalleryRequest[]> {
    const { data, error } = await supabase
      .from('ai_gallery_requests')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Failed to fetch AI gallery requests', error);
      throw new Error(`Failed to fetch requests: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Create a new model or tool request.
   * RLS policy ensures user can only create requests for themselves.
   */
  async createRequest(
    request: CreateAIGalleryRequest,
    userId: string
  ): Promise<AIGalleryRequest> {
    const insertData: AIGalleryRequestInsert = {
      user_id: userId,
      request_type: request.request_type,
      name: request.name,
      description: request.description,
      justification: request.justification || null,
      use_case: request.use_case || null,
      priority: request.priority || 'normal',
      status: 'pending',
    };

    const { data, error } = await supabase
      .from('ai_gallery_requests')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      logger.error('Failed to create AI gallery request', error);
      throw new Error(`Failed to create request: ${error.message}`);
    }

    return data;
  }

  /**
   * Update request status (admin only via RLS).
   * This is used by admins to approve/reject requests.
   */
  async updateRequestStatus(
    requestId: string,
    status: RequestStatus,
    reviewerId: string,
    adminNotes?: string
  ): Promise<AIGalleryRequest> {
    const updateData: AIGalleryRequestUpdate = {
      status,
      admin_notes: adminNotes || null,
      reviewed_by: reviewerId,
      reviewed_at: new Date().toISOString(),
    };

    // If approved and implemented, set implemented_at
    if (status === 'implemented') {
      updateData.implemented_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('ai_gallery_requests')
      .update(updateData)
      .eq('id', requestId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update request status', error);
      throw new Error(`Failed to update request: ${error.message}`);
    }

    return data;
  }

  /**
   * Delete a request.
   * RLS policy ensures user can only delete their own pending requests.
   */
  async deleteRequest(requestId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('ai_gallery_requests')
      .delete()
      .eq('id', requestId)
      .eq('user_id', userId);

    if (error) {
      logger.error('Failed to delete request', error);
      throw new Error(`Failed to delete request: ${error.message}`);
    }
  }

  /**
   * Get all requests (admin only via RLS).
   * Used by admins to review all pending requests.
   */
  async getAllRequests(): Promise<AIGalleryRequest[]> {
    const { data, error } = await supabase
      .from('ai_gallery_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Failed to fetch all AI gallery requests', error);
      throw new Error(`Failed to fetch requests: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get requests filtered by status.
   * Useful for admins to view pending requests.
   */
  async getRequestsByStatus(status: RequestStatus): Promise<AIGalleryRequest[]> {
    const { data, error } = await supabase
      .from('ai_gallery_requests')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Failed to fetch requests by status', error);
      throw new Error(`Failed to fetch requests: ${error.message}`);
    }

    return data || [];
  }
}

export const aiGalleryService = new AIGalleryService();
