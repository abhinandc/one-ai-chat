import { useState, useEffect, useCallback } from 'react';
import {
  aiGalleryService,
  AIGalleryRequest,
  CreateAIGalleryRequest,
  RequestType,
  RequestStatus,
} from '@/services/aiGalleryService';

export interface UseAIGalleryResult {
  requests: AIGalleryRequest[];
  modelRequests: AIGalleryRequest[];
  toolRequests: AIGalleryRequest[];
  loading: boolean;
  error: string | null;
  createRequest: (request: CreateAIGalleryRequest) => Promise<AIGalleryRequest>;
  deleteRequest: (requestId: string) => Promise<void>;
  refetch: () => Promise<void>;
}

export function useAIGallery(userId?: string): UseAIGalleryResult {
  const [requests, setRequests] = useState<AIGalleryRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    if (!userId) {
      setRequests([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await aiGalleryService.getRequests(userId);
      setRequests(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch requests';
      setError(errorMessage);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const createRequest = async (
    request: CreateAIGalleryRequest
  ): Promise<AIGalleryRequest> => {
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const created = await aiGalleryService.createRequest(request, userId);
    await fetchRequests();
    return created;
  };

  const deleteRequest = async (requestId: string): Promise<void> => {
    if (!userId) {
      throw new Error('User not authenticated');
    }

    await aiGalleryService.deleteRequest(requestId, userId);
    await fetchRequests();
  };

  const modelRequests = requests.filter((r) => r.request_type === 'model');
  const toolRequests = requests.filter((r) => r.request_type === 'tool');

  return {
    requests,
    modelRequests,
    toolRequests,
    loading,
    error,
    createRequest,
    deleteRequest,
    refetch: fetchRequests,
  };
}

/**
 * Hook for admin users to view and manage all AI Gallery requests.
 */
export interface UseAIGalleryAdminResult {
  allRequests: AIGalleryRequest[];
  pendingRequests: AIGalleryRequest[];
  loading: boolean;
  error: string | null;
  updateStatus: (
    requestId: string,
    status: RequestStatus,
    adminNotes?: string
  ) => Promise<AIGalleryRequest>;
  refetch: () => Promise<void>;
}

export function useAIGalleryAdmin(
  userId?: string,
  isAdmin?: boolean
): UseAIGalleryAdminResult {
  const [allRequests, setAllRequests] = useState<AIGalleryRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAllRequests = useCallback(async () => {
    if (!userId || !isAdmin) {
      setAllRequests([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await aiGalleryService.getAllRequests();
      setAllRequests(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch requests';
      setError(errorMessage);
      setAllRequests([]);
    } finally {
      setLoading(false);
    }
  }, [userId, isAdmin]);

  useEffect(() => {
    fetchAllRequests();
  }, [fetchAllRequests]);

  const updateStatus = async (
    requestId: string,
    status: RequestStatus,
    adminNotes?: string
  ): Promise<AIGalleryRequest> => {
    if (!userId || !isAdmin) {
      throw new Error('Admin access required');
    }

    const updated = await aiGalleryService.updateRequestStatus(
      requestId,
      status,
      userId,
      adminNotes
    );
    await fetchAllRequests();
    return updated;
  };

  const pendingRequests = allRequests.filter(
    (r) => r.status === 'pending' || r.status === 'under_review'
  );

  return {
    allRequests,
    pendingRequests,
    loading,
    error,
    updateStatus,
    refetch: fetchAllRequests,
  };
}
