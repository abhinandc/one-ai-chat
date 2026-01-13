/**
 * Unit Tests for useConversationFolders Hook
 *
 * Tests the conversation folders hook that manages
 * folder CRUD operations with Supabase.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useConversationFolders } from '@/hooks/useConversationFolders';

// Mock Supabase client
const mockSupabaseSelect = vi.fn();
const mockSupabaseInsert = vi.fn();
const mockSupabaseUpdate = vi.fn();
const mockSupabaseDelete = vi.fn();
const mockSupabaseEq = vi.fn();
const mockSupabaseOrder = vi.fn();
const mockSupabaseSingle = vi.fn();

vi.mock('@/services/supabaseClient', () => ({
  default: {
    from: vi.fn(() => ({
      select: mockSupabaseSelect,
      insert: mockSupabaseInsert,
      update: mockSupabaseUpdate,
      delete: mockSupabaseDelete,
    })),
  },
}));

describe('useConversationFolders', () => {
  const mockEmail = 'test@example.com';

  const mockFolders = [
    {
      id: 'folder-1',
      user_email: mockEmail,
      name: 'Work',
      color: '#3B82F6',
      conversation_ids: ['conv-1', 'conv-2'],
      created_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 'folder-2',
      user_email: mockEmail,
      name: 'Personal',
      color: '#22C55E',
      conversation_ids: ['conv-3'],
      created_at: '2024-01-02T00:00:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup mock chain for select
    mockSupabaseSelect.mockReturnValue({
      eq: mockSupabaseEq,
    });

    mockSupabaseEq.mockReturnValue({
      order: mockSupabaseOrder,
    });

    mockSupabaseOrder.mockResolvedValue({ data: mockFolders, error: null });

    // Setup mock chain for insert
    mockSupabaseInsert.mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: mockSupabaseSingle,
      }),
    });

    // Setup mock chain for update
    mockSupabaseUpdate.mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    });

    // Setup mock chain for delete
    mockSupabaseDelete.mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should return empty folders when email is null', async () => {
    const { result } = renderHook(() => useConversationFolders(null));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.folders).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('should return empty folders when email is undefined', async () => {
    const { result } = renderHook(() => useConversationFolders(undefined));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.folders).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('should start in loading state', () => {
    const { result } = renderHook(() => useConversationFolders(mockEmail));

    expect(result.current.loading).toBe(true);
  });

  it('should fetch folders successfully', async () => {
    const { result } = renderHook(() => useConversationFolders(mockEmail));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeNull();
    expect(result.current.folders).toHaveLength(2);
    expect(result.current.folders[0].name).toBe('Work');
    expect(result.current.folders[1].name).toBe('Personal');
  });

  it('should transform folder data correctly', async () => {
    const { result } = renderHook(() => useConversationFolders(mockEmail));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const folder = result.current.folders[0];
    expect(folder.id).toBe('folder-1');
    expect(folder.name).toBe('Work');
    expect(folder.color).toBe('#3B82F6');
    expect(folder.conversationIds).toEqual(['conv-1', 'conv-2']);
    expect(folder.createdAt).toBeInstanceOf(Date);
  });

  it('should handle fetch errors gracefully', async () => {
    const mockError = { message: 'Failed to fetch folders' };
    mockSupabaseOrder.mockResolvedValue({ data: null, error: mockError });

    const { result } = renderHook(() => useConversationFolders(mockEmail));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Failed to fetch folders');
    expect(result.current.folders).toEqual([]);
  });

  it('should create a new folder successfully', async () => {
    const newFolder = {
      id: 'folder-3',
      user_email: mockEmail,
      name: 'New Folder',
      color: '#A855F7',
      conversation_ids: [],
      created_at: new Date().toISOString(),
    };

    mockSupabaseSingle.mockResolvedValue({ data: newFolder, error: null });

    const { result } = renderHook(() => useConversationFolders(mockEmail));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let createdFolder;
    await act(async () => {
      createdFolder = await result.current.createFolder('New Folder', '#A855F7');
    });

    expect(createdFolder).not.toBeNull();
    expect(createdFolder?.name).toBe('New Folder');
    expect(createdFolder?.color).toBe('#A855F7');
  });

  it('should return null when creating folder without email', async () => {
    const { result } = renderHook(() => useConversationFolders(null));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let createdFolder;
    await act(async () => {
      createdFolder = await result.current.createFolder('New Folder', '#A855F7');
    });

    expect(createdFolder).toBeNull();
  });

  it('should handle create folder errors', async () => {
    const mockError = { message: 'Failed to create folder' };
    mockSupabaseSingle.mockResolvedValue({ data: null, error: mockError });

    const { result } = renderHook(() => useConversationFolders(mockEmail));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let createdFolder;
    await act(async () => {
      createdFolder = await result.current.createFolder('New Folder', '#A855F7');
    });

    expect(createdFolder).toBeNull();
    expect(result.current.error).toBe('Failed to create folder');
  });

  it('should update a folder successfully', async () => {
    const { result } = renderHook(() => useConversationFolders(mockEmail));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let success;
    await act(async () => {
      success = await result.current.updateFolder('folder-1', { name: 'Updated Work' });
    });

    expect(success).toBe(true);
  });

  it('should return false when updating folder without email', async () => {
    const { result } = renderHook(() => useConversationFolders(null));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let success;
    await act(async () => {
      success = await result.current.updateFolder('folder-1', { name: 'Updated Work' });
    });

    expect(success).toBe(false);
  });

  it('should delete a folder successfully', async () => {
    const { result } = renderHook(() => useConversationFolders(mockEmail));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let success;
    await act(async () => {
      success = await result.current.deleteFolder('folder-1');
    });

    expect(success).toBe(true);
  });

  it('should return false when deleting folder without email', async () => {
    const { result } = renderHook(() => useConversationFolders(null));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let success;
    await act(async () => {
      success = await result.current.deleteFolder('folder-1');
    });

    expect(success).toBe(false);
  });

  it('should expose refetch function', async () => {
    const { result } = renderHook(() => useConversationFolders(mockEmail));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(typeof result.current.refetch).toBe('function');
  });

  it('should update folders state after creating a folder', async () => {
    const newFolder = {
      id: 'folder-3',
      user_email: mockEmail,
      name: 'New Folder',
      color: '#A855F7',
      conversation_ids: [],
      created_at: new Date().toISOString(),
    };

    mockSupabaseSingle.mockResolvedValue({ data: newFolder, error: null });

    const { result } = renderHook(() => useConversationFolders(mockEmail));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const initialLength = result.current.folders.length;

    await act(async () => {
      await result.current.createFolder('New Folder', '#A855F7');
    });

    expect(result.current.folders.length).toBe(initialLength + 1);
    expect(result.current.folders[result.current.folders.length - 1].name).toBe('New Folder');
  });

  it('should update folders state after deleting a folder', async () => {
    const { result } = renderHook(() => useConversationFolders(mockEmail));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const initialLength = result.current.folders.length;

    await act(async () => {
      await result.current.deleteFolder('folder-1');
    });

    expect(result.current.folders.length).toBe(initialLength - 1);
    expect(result.current.folders.find((f) => f.id === 'folder-1')).toBeUndefined();
  });

  it('should use default color when not provided', async () => {
    const newFolder = {
      id: 'folder-3',
      user_email: mockEmail,
      name: 'New Folder',
      color: '#3B82F6',
      conversation_ids: [],
      created_at: new Date().toISOString(),
    };

    mockSupabaseSingle.mockResolvedValue({ data: newFolder, error: null });

    const { result } = renderHook(() => useConversationFolders(mockEmail));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let createdFolder;
    await act(async () => {
      createdFolder = await result.current.createFolder('New Folder');
    });

    expect(createdFolder?.color).toBe('#3B82F6');
  });
});
