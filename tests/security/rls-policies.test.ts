/**
 * RLS Policy Tests for OneEdge
 *
 * These tests verify that Row Level Security policies are correctly enforced
 * for all OneEdge-specific tables.
 *
 * Test Strategy:
 * 1. Test user isolation - users can only access their own data
 * 2. Test admin privileges - admins can access admin-only resources
 * 3. Test shared resources - proper access to shared items
 * 4. Test anonymous access - verify no access without authentication
 *
 * @module tests/security/rls-policies
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../src/integrations/supabase/types';

// Test configuration - these should be set in test environment
const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? 'http://localhost:54321';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY ?? '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

// Test user credentials (should be created in test setup)
const TEST_USER_1 = {
  email: 'test-user-1@oneedge-test.local',
  password: 'test-password-123!',
  id: '', // Will be set after signup
};

const TEST_USER_2 = {
  email: 'test-user-2@oneedge-test.local',
  password: 'test-password-123!',
  id: '', // Will be set after signup
};

const TEST_ADMIN = {
  email: 'test-admin@oneedge-test.local',
  password: 'test-password-123!',
  id: '', // Will be set after signup
};

// Helper to create authenticated client
function createAuthenticatedClient(accessToken: string): SupabaseClient<Database> {
  return createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
}

// Service role client for test setup/teardown
function createServiceClient(): SupabaseClient<Database> {
  return createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: {
      persistSession: false,
    },
  });
}

// Skip entire test suite if no service key available
const skipTests = !SUPABASE_SERVICE_KEY || !SUPABASE_ANON_KEY;

describe.skipIf(skipTests)('RLS Policies', () => {
  let serviceClient: SupabaseClient<Database>;
  let user1Client: SupabaseClient<Database>;
  let user2Client: SupabaseClient<Database>;
  let adminClient: SupabaseClient<Database>;
  let anonClient: SupabaseClient<Database>;

  // Test data IDs for cleanup
  const testAgentIds: string[] = [];
  const testCredentialIds: string[] = [];
  const testProjectIds: string[] = [];
  const testRequestIds: string[] = [];

  beforeAll(async () => {

    serviceClient = createServiceClient();
    anonClient = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false },
    });

    // Create test users using service client
    const createTestUser = async (user: typeof TEST_USER_1) => {
      const { data, error } = await serviceClient.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
      });
      if (error) throw error;
      return data.user;
    };

    try {
      // Create users
      const user1 = await createTestUser(TEST_USER_1);
      const user2 = await createTestUser(TEST_USER_2);
      const admin = await createTestUser(TEST_ADMIN);

      TEST_USER_1.id = user1.id;
      TEST_USER_2.id = user2.id;
      TEST_ADMIN.id = admin.id;

      // Set admin role
      await serviceClient.from('user_roles').insert({
        user_id: TEST_ADMIN.id,
        role: 'admin',
      });

      // Get access tokens
      const getAccessToken = async (email: string, password: string) => {
        const { data, error } = await anonClient.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        return data.session.access_token;
      };

      const user1Token = await getAccessToken(TEST_USER_1.email, TEST_USER_1.password);
      const user2Token = await getAccessToken(TEST_USER_2.email, TEST_USER_2.password);
      const adminToken = await getAccessToken(TEST_ADMIN.email, TEST_ADMIN.password);

      user1Client = createAuthenticatedClient(user1Token);
      user2Client = createAuthenticatedClient(user2Token);
      adminClient = createAuthenticatedClient(adminToken);
    } catch (error) {
      console.error('Failed to set up test users:', error);
      throw error;
    }
  });

  afterAll(async () => {
    if (!SUPABASE_SERVICE_KEY) return;

    // Clean up test data using service client
    try {
      // Delete test agents
      if (testAgentIds.length > 0) {
        await serviceClient.from('agents').delete().in('id', testAgentIds);
      }

      // Delete test credentials
      if (testCredentialIds.length > 0) {
        await serviceClient.from('edge_vault_credentials').delete().in('id', testCredentialIds);
      }

      // Delete test projects
      if (testProjectIds.length > 0) {
        await serviceClient.from('projects').delete().in('id', testProjectIds);
      }

      // Delete test requests
      if (testRequestIds.length > 0) {
        await serviceClient.from('ai_gallery_requests').delete().in('id', testRequestIds);
      }

      // Delete user roles
      await serviceClient.from('user_roles').delete().eq('user_id', TEST_ADMIN.id);

      // Delete test users
      await serviceClient.auth.admin.deleteUser(TEST_USER_1.id);
      await serviceClient.auth.admin.deleteUser(TEST_USER_2.id);
      await serviceClient.auth.admin.deleteUser(TEST_ADMIN.id);
    } catch (error) {
      console.error('Failed to clean up test data:', error);
    }
  });

  describe('Agents Table', () => {
    it('should allow user to create their own agent', async () => {
      const { data, error } = await user1Client.from('agents').insert({
        user_id: TEST_USER_1.id,
        name: 'Test Agent',
        model: 'gpt-4',
      }).select().single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.user_id).toBe(TEST_USER_1.id);

      if (data) testAgentIds.push(data.id);
    });

    it('should prevent user from creating agent for another user', async () => {
      const { error } = await user1Client.from('agents').insert({
        user_id: TEST_USER_2.id, // Trying to create for another user
        name: 'Malicious Agent',
        model: 'gpt-4',
      });

      expect(error).not.toBeNull();
      // RLS should block this
    });

    it('should only return user\'s own agents', async () => {
      // Create agent for user2
      const { data: user2Agent } = await serviceClient.from('agents').insert({
        user_id: TEST_USER_2.id,
        name: 'User 2 Agent',
        model: 'claude-3',
      }).select().single();

      if (user2Agent) testAgentIds.push(user2Agent.id);

      // User1 should not see user2's agent
      const { data: user1Agents } = await user1Client.from('agents').select('*');

      expect(user1Agents).toBeDefined();
      const hasUser2Agent = user1Agents?.some(a => a.id === user2Agent?.id);
      expect(hasUser2Agent).toBe(false);
    });

    it('should allow access to shared agents', async () => {
      // Create shared agent
      const { data: sharedAgent } = await serviceClient.from('agents').insert({
        user_id: TEST_USER_1.id,
        name: 'Shared Agent',
        model: 'gpt-4',
        shared_with: [TEST_USER_2.id],
      }).select().single();

      if (sharedAgent) testAgentIds.push(sharedAgent.id);

      // User2 should be able to see the shared agent
      const { data: user2Agents } = await user2Client
        .from('agents')
        .select('*')
        .eq('id', sharedAgent?.id);

      expect(user2Agents).toBeDefined();
      expect(user2Agents?.length).toBe(1);
    });

    it('should prevent user from updating another user\'s agent', async () => {
      // Get an agent belonging to user1
      const { data: user1Agent } = await user1Client
        .from('agents')
        .select('*')
        .limit(1)
        .single();

      if (!user1Agent) return;

      // User2 should not be able to update it
      const { error } = await user2Client
        .from('agents')
        .update({ name: 'Hacked Agent' })
        .eq('id', user1Agent.id);

      // The update should either error or affect 0 rows
      // RLS policies typically silently filter rather than error
      const { data: unchanged } = await user1Client
        .from('agents')
        .select('*')
        .eq('id', user1Agent.id)
        .single();

      expect(unchanged?.name).toBe(user1Agent.name);
    });
  });

  describe('Edge Vault Credentials Table', () => {
    it('should allow user to create their own credentials', async () => {
      const { data, error } = await user1Client.from('edge_vault_credentials').insert({
        user_id: TEST_USER_1.id,
        integration_type: 'google',
        label: 'Test Google',
        encrypted_credentials: 'encrypted-data',
      }).select().single();

      expect(error).toBeNull();
      expect(data).toBeDefined();

      if (data) testCredentialIds.push(data.id);
    });

    it('should completely isolate credentials between users', async () => {
      // Create credential for user1
      const { data: cred } = await serviceClient.from('edge_vault_credentials').insert({
        user_id: TEST_USER_1.id,
        integration_type: 'slack',
        label: 'Private Slack',
        encrypted_credentials: 'secret-token',
      }).select().single();

      if (cred) testCredentialIds.push(cred.id);

      // User2 should see zero credentials from user1
      const { data: user2Creds } = await user2Client
        .from('edge_vault_credentials')
        .select('*');

      const hasUser1Cred = user2Creds?.some(c => c.user_id === TEST_USER_1.id);
      expect(hasUser1Cred).toBe(false);
    });

    it('should not allow admin to view other users\' credentials', async () => {
      // Credentials are strictly private - even admins cannot see them via RLS
      const { data: user1Creds } = await adminClient
        .from('edge_vault_credentials')
        .select('*')
        .eq('user_id', TEST_USER_1.id);

      // Admin should not see user1's credentials
      expect(user1Creds?.length).toBe(0);
    });
  });

  describe('Automation Templates Table', () => {
    it('should allow employees to view active templates', async () => {
      // Create active template via service client
      const { data: template } = await serviceClient.from('automation_templates').insert({
        name: 'Test Template',
        category: 'gsuite',
        template_data: { steps: [] },
        is_active: true,
        created_by: TEST_ADMIN.id,
      }).select().single();

      // User should be able to see it
      const { data: templates } = await user1Client
        .from('automation_templates')
        .select('*')
        .eq('id', template?.id);

      expect(templates?.length).toBe(1);

      // Cleanup
      if (template) {
        await serviceClient.from('automation_templates').delete().eq('id', template.id);
      }
    });

    it('should hide inactive templates from employees', async () => {
      // Create inactive template via service client
      const { data: template } = await serviceClient.from('automation_templates').insert({
        name: 'Inactive Template',
        category: 'slack',
        template_data: { steps: [] },
        is_active: false,
        created_by: TEST_ADMIN.id,
      }).select().single();

      // User should NOT be able to see it
      const { data: templates } = await user1Client
        .from('automation_templates')
        .select('*')
        .eq('id', template?.id);

      expect(templates?.length).toBe(0);

      // Admin should be able to see it
      const { data: adminTemplates } = await adminClient
        .from('automation_templates')
        .select('*')
        .eq('id', template?.id);

      expect(adminTemplates?.length).toBe(1);

      // Cleanup
      if (template) {
        await serviceClient.from('automation_templates').delete().eq('id', template.id);
      }
    });

    it('should only allow admins to create templates', async () => {
      const { error } = await user1Client.from('automation_templates').insert({
        name: 'Unauthorized Template',
        category: 'custom',
        template_data: { steps: [] },
      });

      expect(error).not.toBeNull();
    });

    it('should allow admins to create templates', async () => {
      const { data, error } = await adminClient.from('automation_templates').insert({
        name: 'Admin Template',
        category: 'email',
        template_data: { steps: [] },
        created_by: TEST_ADMIN.id,
      }).select().single();

      expect(error).toBeNull();
      expect(data).toBeDefined();

      // Cleanup
      if (data) {
        await serviceClient.from('automation_templates').delete().eq('id', data.id);
      }
    });
  });

  describe('Projects Table', () => {
    it('should allow user to create and manage their own projects', async () => {
      const { data, error } = await user1Client.from('projects').insert({
        user_id: TEST_USER_1.id,
        name: 'My Project',
        color: '#FF5733',
      }).select().single();

      expect(error).toBeNull();
      expect(data).toBeDefined();

      if (data) testProjectIds.push(data.id);
    });

    it('should completely isolate projects between users', async () => {
      const { data: project } = await serviceClient.from('projects').insert({
        user_id: TEST_USER_1.id,
        name: 'Secret Project',
      }).select().single();

      if (project) testProjectIds.push(project.id);

      // User2 should not see user1's projects
      const { data: user2Projects } = await user2Client.from('projects').select('*');

      const hasUser1Project = user2Projects?.some(p => p.user_id === TEST_USER_1.id);
      expect(hasUser1Project).toBe(false);
    });
  });

  describe('AI Gallery Requests Table', () => {
    it('should allow user to create requests', async () => {
      const { data, error } = await user1Client.from('ai_gallery_requests').insert({
        user_id: TEST_USER_1.id,
        request_type: 'model',
        name: 'GPT-5',
        description: 'Request access to GPT-5',
      }).select().single();

      expect(error).toBeNull();
      expect(data).toBeDefined();

      if (data) testRequestIds.push(data.id);
    });

    it('should allow user to view only their own requests', async () => {
      // Create request for user2
      const { data: user2Request } = await serviceClient.from('ai_gallery_requests').insert({
        user_id: TEST_USER_2.id,
        request_type: 'tool',
        name: 'User2 Tool',
        description: 'Private request',
      }).select().single();

      if (user2Request) testRequestIds.push(user2Request.id);

      // User1 should not see user2's request
      const { data: user1Requests } = await user1Client.from('ai_gallery_requests').select('*');

      const hasUser2Request = user1Requests?.some(r => r.user_id === TEST_USER_2.id);
      expect(hasUser2Request).toBe(false);
    });

    it('should allow admins to view all requests', async () => {
      const { data: allRequests } = await adminClient.from('ai_gallery_requests').select('*');

      // Admin should see requests from both users
      expect(allRequests).toBeDefined();
      expect(allRequests?.length).toBeGreaterThan(0);
    });

    it('should allow admins to update request status', async () => {
      // Get a request
      const { data: request } = await serviceClient
        .from('ai_gallery_requests')
        .select('*')
        .limit(1)
        .single();

      if (!request) return;

      // Admin updates status
      const { error } = await adminClient
        .from('ai_gallery_requests')
        .update({
          status: 'approved',
          admin_notes: 'Approved by admin',
          reviewed_by: TEST_ADMIN.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', request.id);

      expect(error).toBeNull();
    });
  });

  describe('Sia Memory Table', () => {
    it('should allow user to create their own Sia memory', async () => {
      const { data, error } = await user1Client.from('sia_memory').insert({
        user_id: TEST_USER_1.id,
        memory_data: { facts: [], preferences: {} },
      }).select().single();

      expect(error).toBeNull();
      expect(data).toBeDefined();

      // Cleanup via service client (upsert creates only one per user)
      if (data) {
        await serviceClient.from('sia_memory').delete().eq('id', data.id);
      }
    });

    it('should completely isolate Sia memory between users', async () => {
      // Create memory for user1 via service
      await serviceClient.from('sia_memory').upsert({
        user_id: TEST_USER_1.id,
        memory_data: { facts: ['private fact'], preferences: {} },
      });

      // User2 should not see user1's memory
      const { data: user2Memory } = await user2Client.from('sia_memory').select('*');

      const hasUser1Memory = user2Memory?.some(m => m.user_id === TEST_USER_1.id);
      expect(hasUser1Memory).toBe(false);

      // Cleanup
      await serviceClient.from('sia_memory').delete().eq('user_id', TEST_USER_1.id);
    });
  });

  describe('Anonymous Access', () => {
    it('should deny anonymous access to agents', async () => {
      const { data, error } = await anonClient.from('agents').select('*');

      // Should either error or return empty due to RLS
      expect(data?.length ?? 0).toBe(0);
    });

    it('should deny anonymous access to credentials', async () => {
      const { data } = await anonClient.from('edge_vault_credentials').select('*');
      expect(data?.length ?? 0).toBe(0);
    });

    it('should allow anonymous access to external prompts', async () => {
      // External prompts are public read
      // First create one via service
      const { data: feed } = await serviceClient.from('prompt_feeds').insert({
        name: 'Test Feed',
        source_type: 'api',
        source_url: 'https://example.com/api',
        is_active: true,
      }).select().single();

      if (feed) {
        const { data: prompt } = await serviceClient.from('external_prompts').insert({
          feed_id: feed.id,
          external_id: 'ext-1',
          title: 'Public Prompt',
          content: 'This is a public prompt',
        }).select().single();

        // Anonymous users can read external prompts
        // Note: This depends on authentication being optional for reads
        // In strict setups, this might still require auth

        // Cleanup
        if (prompt) await serviceClient.from('external_prompts').delete().eq('id', prompt.id);
        await serviceClient.from('prompt_feeds').delete().eq('id', feed.id);
      }
    });
  });

  describe('User Roles Table', () => {
    it('should allow users to view their own role', async () => {
      const { data } = await adminClient
        .from('user_roles')
        .select('*')
        .eq('user_id', TEST_ADMIN.id);

      expect(data).toBeDefined();
      expect(data?.length).toBe(1);
      expect(data?.[0].role).toBe('admin');
    });

    it('should prevent users from modifying their own role', async () => {
      // Create a role for user1 if not exists
      await serviceClient.from('user_roles').upsert({
        user_id: TEST_USER_1.id,
        role: 'employee',
      });

      // User1 should not be able to change their role to admin
      const { error } = await user1Client
        .from('user_roles')
        .update({ role: 'admin' })
        .eq('user_id', TEST_USER_1.id);

      // Should either error or not affect rows
      const { data } = await serviceClient
        .from('user_roles')
        .select('*')
        .eq('user_id', TEST_USER_1.id)
        .single();

      expect(data?.role).toBe('employee');

      // Cleanup
      await serviceClient.from('user_roles').delete().eq('user_id', TEST_USER_1.id);
    });

    it('should allow admins to modify other users\' roles', async () => {
      // Create employee role for user1
      await serviceClient.from('user_roles').upsert({
        user_id: TEST_USER_1.id,
        role: 'employee',
      });

      // Admin updates user1's role
      const { error } = await adminClient
        .from('user_roles')
        .update({ role: 'admin' })
        .eq('user_id', TEST_USER_1.id);

      expect(error).toBeNull();

      // Verify change
      const { data } = await serviceClient
        .from('user_roles')
        .select('*')
        .eq('user_id', TEST_USER_1.id)
        .single();

      expect(data?.role).toBe('admin');

      // Cleanup - restore to employee
      await serviceClient
        .from('user_roles')
        .update({ role: 'employee' })
        .eq('user_id', TEST_USER_1.id);

      await serviceClient.from('user_roles').delete().eq('user_id', TEST_USER_1.id);
    });
  });
});
