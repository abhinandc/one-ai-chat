import { useState, useEffect, useCallback } from 'react';
import {
  adminService,
  UserRole,
  PromptFeed,
  AutomationTemplate,
  UserWithRole,
} from '@/services/adminService';

export interface UseAdminResult {
  isAdmin: boolean;
  userRole: UserRole;
  loading: boolean;
  error: string | null;
}

export function useAdmin(userId?: string): UseAdminResult {
  const [userRole, setUserRole] = useState<UserRole>('employee');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRole = async () => {
      if (!userId) {
        setUserRole('employee');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const role = await adminService.getUserRole(userId);
        setUserRole(role);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to fetch user role';
        setError(errorMessage);
        setUserRole('employee');
      } finally {
        setLoading(false);
      }
    };

    fetchRole();
  }, [userId]);

  return {
    isAdmin: userRole === 'admin',
    userRole,
    loading,
    error,
  };
}

export interface UsePromptFeedsResult {
  feeds: PromptFeed[];
  loading: boolean;
  error: string | null;
  createFeed: (feed: Omit<PromptFeed, 'id' | 'created_at' | 'last_sync_at'>) => Promise<PromptFeed>;
  updateFeed: (feedId: string, updates: Partial<PromptFeed>) => Promise<PromptFeed>;
  deleteFeed: (feedId: string) => Promise<void>;
  refetch: () => Promise<void>;
}

export function usePromptFeeds(): UsePromptFeedsResult {
  const [feeds, setFeeds] = useState<PromptFeed[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFeeds = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminService.getPromptFeeds();
      setFeeds(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch prompt feeds';
      setError(errorMessage);
      setFeeds([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeeds();
  }, [fetchFeeds]);

  const createFeed = async (
    feed: Omit<PromptFeed, 'id' | 'created_at' | 'last_sync_at'>
  ): Promise<PromptFeed> => {
    const created = await adminService.createPromptFeed(feed);
    await fetchFeeds();
    return created;
  };

  const updateFeed = async (
    feedId: string,
    updates: Partial<PromptFeed>
  ): Promise<PromptFeed> => {
    const updated = await adminService.updatePromptFeed(feedId, updates);
    await fetchFeeds();
    return updated;
  };

  const deleteFeed = async (feedId: string): Promise<void> => {
    await adminService.deletePromptFeed(feedId);
    await fetchFeeds();
  };

  return {
    feeds,
    loading,
    error,
    createFeed,
    updateFeed,
    deleteFeed,
    refetch: fetchFeeds,
  };
}

export interface UseAutomationTemplatesResult {
  templates: AutomationTemplate[];
  loading: boolean;
  error: string | null;
  createTemplate: (
    template: Omit<AutomationTemplate, 'id' | 'created_at' | 'updated_at'>
  ) => Promise<AutomationTemplate>;
  updateTemplate: (
    templateId: string,
    updates: Partial<AutomationTemplate>
  ) => Promise<AutomationTemplate>;
  deleteTemplate: (templateId: string) => Promise<void>;
  refetch: () => Promise<void>;
}

export function useAutomationTemplates(): UseAutomationTemplatesResult {
  const [templates, setTemplates] = useState<AutomationTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminService.getAutomationTemplates();
      setTemplates(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch automation templates';
      setError(errorMessage);
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const createTemplate = async (
    template: Omit<AutomationTemplate, 'id' | 'created_at' | 'updated_at'>
  ): Promise<AutomationTemplate> => {
    const created = await adminService.createAutomationTemplate(template);
    await fetchTemplates();
    return created;
  };

  const updateTemplate = async (
    templateId: string,
    updates: Partial<AutomationTemplate>
  ): Promise<AutomationTemplate> => {
    const updated = await adminService.updateAutomationTemplate(templateId, updates);
    await fetchTemplates();
    return updated;
  };

  const deleteTemplate = async (templateId: string): Promise<void> => {
    await adminService.deleteAutomationTemplate(templateId);
    await fetchTemplates();
  };

  return {
    templates,
    loading,
    error,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    refetch: fetchTemplates,
  };
}

export interface UseUsersResult {
  users: UserWithRole[];
  loading: boolean;
  error: string | null;
  setUserRole: (userId: string, role: UserRole) => Promise<void>;
  refetch: () => Promise<void>;
}

export function useUsers(): UseUsersResult {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminService.getUsers();
      setUsers(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch users';
      setError(errorMessage);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const setUserRole = async (userId: string, role: UserRole): Promise<void> => {
    await adminService.setUserRole(userId, role);
    await fetchUsers();
  };

  return {
    users,
    loading,
    error,
    setUserRole,
    refetch: fetchUsers,
  };
}
