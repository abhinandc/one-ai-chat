/**
 * Supabase Database Types for OneEdge
 *
 * This file contains TypeScript types for all database tables used by OneEdge.
 * It includes both EdgeAdmin shared tables and OneEdge-specific tables.
 *
 * @module integrations/supabase/types
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// ============================================================================
// DATABASE TYPE DEFINITION
// ============================================================================

export type Database = {
  public: {
    Tables: {
      // ========================================================================
      // ONEEDGE-SPECIFIC TABLES
      // ========================================================================

      /**
       * User roles for OneEdge platform
       * Distinguishes admins from regular employees
       */
      user_roles: {
        Row: {
          id: string;
          user_id: string;
          role: 'admin' | 'employee';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          role?: 'admin' | 'employee';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          role?: 'admin' | 'employee';
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_roles_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: true;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };

      /**
       * Custom AI agent definitions
       */
      agents: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          model: string;
          system_prompt: string | null;
          workflow_data: Json;
          is_shared: boolean;
          shared_with: string[];
          tags: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          model: string;
          system_prompt?: string | null;
          workflow_data?: Json;
          is_shared?: boolean;
          shared_with?: string[];
          tags?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          model?: string;
          system_prompt?: string | null;
          workflow_data?: Json;
          is_shared?: boolean;
          shared_with?: string[];
          tags?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'agents_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };

      /**
       * Secure credential storage for integrations (EdgeVault)
       */
      edge_vault_credentials: {
        Row: {
          id: string;
          user_id: string;
          integration_type: 'google' | 'slack' | 'jira' | 'n8n' | 'github' | 'notion' | 'custom';
          label: string;
          encrypted_credentials: string;
          status: 'active' | 'expired' | 'error' | 'revoked';
          last_validated_at: string | null;
          expires_at: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          integration_type: 'google' | 'slack' | 'jira' | 'n8n' | 'github' | 'notion' | 'custom';
          label: string;
          encrypted_credentials: string;
          status?: 'active' | 'expired' | 'error' | 'revoked';
          last_validated_at?: string | null;
          expires_at?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          integration_type?: 'google' | 'slack' | 'jira' | 'n8n' | 'github' | 'notion' | 'custom';
          label?: string;
          encrypted_credentials?: string;
          status?: 'active' | 'expired' | 'error' | 'revoked';
          last_validated_at?: string | null;
          expires_at?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'edge_vault_credentials_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };

      /**
       * Admin-maintained automation templates
       */
      automation_templates: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          category: 'gsuite' | 'slack' | 'jira' | 'chat' | 'email' | 'custom';
          template_data: Json;
          required_credentials: string[];
          default_model: string | null;
          is_active: boolean;
          is_featured: boolean;
          usage_count: number;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          category: 'gsuite' | 'slack' | 'jira' | 'chat' | 'email' | 'custom';
          template_data: Json;
          required_credentials?: string[];
          default_model?: string | null;
          is_active?: boolean;
          is_featured?: boolean;
          usage_count?: number;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          category?: 'gsuite' | 'slack' | 'jira' | 'chat' | 'email' | 'custom';
          template_data?: Json;
          required_credentials?: string[];
          default_model?: string | null;
          is_active?: boolean;
          is_featured?: boolean;
          usage_count?: number;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'automation_templates_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };

      /**
       * External prompt feed configurations
       */
      prompt_feeds: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          source_type: 'api' | 'webhook' | 'rss';
          source_url: string;
          api_key_encrypted: string | null;
          auth_header: string | null;
          refresh_interval_minutes: number;
          is_active: boolean;
          last_sync_at: string | null;
          last_sync_status: 'success' | 'error' | 'pending' | null;
          last_sync_error: string | null;
          prompts_count: number;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          source_type: 'api' | 'webhook' | 'rss';
          source_url: string;
          api_key_encrypted?: string | null;
          auth_header?: string | null;
          refresh_interval_minutes?: number;
          is_active?: boolean;
          last_sync_at?: string | null;
          last_sync_status?: 'success' | 'error' | 'pending' | null;
          last_sync_error?: string | null;
          prompts_count?: number;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          source_type?: 'api' | 'webhook' | 'rss';
          source_url?: string;
          api_key_encrypted?: string | null;
          auth_header?: string | null;
          refresh_interval_minutes?: number;
          is_active?: boolean;
          last_sync_at?: string | null;
          last_sync_status?: 'success' | 'error' | 'pending' | null;
          last_sync_error?: string | null;
          prompts_count?: number;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'prompt_feeds_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };

      /**
       * Prompts imported from external feeds
       */
      external_prompts: {
        Row: {
          id: string;
          feed_id: string;
          external_id: string;
          title: string;
          content: string;
          description: string | null;
          author: string | null;
          author_url: string | null;
          source_url: string | null;
          category: string | null;
          tags: string[];
          difficulty: 'beginner' | 'intermediate' | 'advanced' | null;
          likes_count: number;
          uses_count: number;
          fetched_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          feed_id: string;
          external_id: string;
          title: string;
          content: string;
          description?: string | null;
          author?: string | null;
          author_url?: string | null;
          source_url?: string | null;
          category?: string | null;
          tags?: string[];
          difficulty?: 'beginner' | 'intermediate' | 'advanced' | null;
          likes_count?: number;
          uses_count?: number;
          fetched_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          feed_id?: string;
          external_id?: string;
          title?: string;
          content?: string;
          description?: string | null;
          author?: string | null;
          author_url?: string | null;
          source_url?: string | null;
          category?: string | null;
          tags?: string[];
          difficulty?: 'beginner' | 'intermediate' | 'advanced' | null;
          likes_count?: number;
          uses_count?: number;
          fetched_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'external_prompts_feed_id_fkey';
            columns: ['feed_id'];
            isOneToOne: false;
            referencedRelation: 'prompt_feeds';
            referencedColumns: ['id'];
          }
        ];
      };

      /**
       * Employee requests for new AI models or tools
       */
      ai_gallery_requests: {
        Row: {
          id: string;
          user_id: string;
          request_type: 'model' | 'tool';
          name: string;
          description: string;
          justification: string | null;
          use_case: string | null;
          priority: 'low' | 'normal' | 'high' | 'urgent';
          status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'implemented';
          admin_notes: string | null;
          reviewed_by: string | null;
          reviewed_at: string | null;
          implemented_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          request_type: 'model' | 'tool';
          name: string;
          description: string;
          justification?: string | null;
          use_case?: string | null;
          priority?: 'low' | 'normal' | 'high' | 'urgent';
          status?: 'pending' | 'under_review' | 'approved' | 'rejected' | 'implemented';
          admin_notes?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          implemented_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          request_type?: 'model' | 'tool';
          name?: string;
          description?: string;
          justification?: string | null;
          use_case?: string | null;
          priority?: 'low' | 'normal' | 'high' | 'urgent';
          status?: 'pending' | 'under_review' | 'approved' | 'rejected' | 'implemented';
          admin_notes?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          implemented_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'ai_gallery_requests_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'ai_gallery_requests_reviewed_by_fkey';
            columns: ['reviewed_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };

      /**
       * User n8n instance configurations
       */
      n8n_configurations: {
        Row: {
          id: string;
          user_id: string;
          instance_url: string;
          api_key_encrypted: string;
          webhook_url: string | null;
          is_connected: boolean;
          connection_status: 'connected' | 'disconnected' | 'error' | 'pending';
          last_sync_at: string | null;
          workflows_count: number;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          instance_url: string;
          api_key_encrypted: string;
          webhook_url?: string | null;
          is_connected?: boolean;
          connection_status?: 'connected' | 'disconnected' | 'error' | 'pending';
          last_sync_at?: string | null;
          workflows_count?: number;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          instance_url?: string;
          api_key_encrypted?: string;
          webhook_url?: string | null;
          is_connected?: boolean;
          connection_status?: 'connected' | 'disconnected' | 'error' | 'pending';
          last_sync_at?: string | null;
          workflows_count?: number;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'n8n_configurations_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: true;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };

      /**
       * Mobile app conversation organization
       */
      projects: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          color: string;
          icon: string;
          conversation_ids: string[];
          is_archived: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          color?: string;
          icon?: string;
          conversation_ids?: string[];
          is_archived?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          color?: string;
          icon?: string;
          conversation_ids?: string[];
          is_archived?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'projects_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };

      /**
       * Persistent Sia voice assistant memory
       */
      sia_memory: {
        Row: {
          id: string;
          user_id: string;
          memory_data: Json;
          summary: string | null;
          personality_adjustments: Json;
          total_interactions: number;
          last_interaction_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          memory_data?: Json;
          summary?: string | null;
          personality_adjustments?: Json;
          total_interactions?: number;
          last_interaction_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          memory_data?: Json;
          summary?: string | null;
          personality_adjustments?: Json;
          total_interactions?: number;
          last_interaction_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'sia_memory_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: true;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };

      // ========================================================================
      // SHARED TABLES (FROM EDGEADMIN)
      // ========================================================================

      /**
       * Virtual keys for API access (managed by EdgeAdmin)
       */
      virtual_keys: {
        Row: {
          id: string;
          admin_virtual_key_id: string | null;
          budget_usd: number;
          created_at: string | null;
          disabled: boolean;
          email: string;
          expires_at: string | null;
          key_hash: string;
          label: string;
          masked_key: string | null;
          models_json: Json;
          rpd: number;
          rpm: number;
          tags_json: Json | null;
          team_id: string | null;
          tpd: number;
          tpm: number;
        };
        Insert: {
          id?: string;
          admin_virtual_key_id?: string | null;
          budget_usd?: number;
          created_at?: string | null;
          disabled?: boolean;
          email: string;
          expires_at?: string | null;
          key_hash: string;
          label: string;
          masked_key?: string | null;
          models_json?: Json;
          rpd?: number;
          rpm?: number;
          tags_json?: Json | null;
          team_id?: string | null;
          tpd?: number;
          tpm?: number;
        };
        Update: {
          id?: string;
          admin_virtual_key_id?: string | null;
          budget_usd?: number;
          created_at?: string | null;
          disabled?: boolean;
          email?: string;
          expires_at?: string | null;
          key_hash?: string;
          label?: string;
          masked_key?: string | null;
          models_json?: Json;
          rpd?: number;
          rpm?: number;
          tags_json?: Json | null;
          team_id?: string | null;
          tpd?: number;
          tpm?: number;
        };
        Relationships: [];
      };

      /**
       * Available AI models (managed by EdgeAdmin)
       */
      models: {
        Row: {
          id: string;
          name: string;
          provider: string;
          description: string | null;
          context_length: number | null;
          cost_per_1k_input: number | null;
          cost_per_1k_output: number | null;
          max_tokens: number | null;
          features: string[] | null;
          is_available: boolean | null;
          is_public: boolean | null;
          kind: string | null;
          mode: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          provider?: string;
          description?: string | null;
          context_length?: number | null;
          cost_per_1k_input?: number | null;
          cost_per_1k_output?: number | null;
          max_tokens?: number | null;
          features?: string[] | null;
          is_available?: boolean | null;
          is_public?: boolean | null;
          kind?: string | null;
          mode?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          provider?: string;
          description?: string | null;
          context_length?: number | null;
          cost_per_1k_input?: number | null;
          cost_per_1k_output?: number | null;
          max_tokens?: number | null;
          features?: string[] | null;
          is_available?: boolean | null;
          is_public?: boolean | null;
          kind?: string | null;
          mode?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };

      /**
       * Chat conversations
       */
      conversations: {
        Row: {
          id: string;
          user_email: string;
          title: string;
          messages: Json;
          folder_id: string | null;
          pinned: boolean | null;
          shared: boolean | null;
          unread: boolean | null;
          tags: string[] | null;
          settings: Json;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_email: string;
          title: string;
          messages?: Json;
          folder_id?: string | null;
          pinned?: boolean | null;
          shared?: boolean | null;
          unread?: boolean | null;
          tags?: string[] | null;
          settings?: Json;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          user_email?: string;
          title?: string;
          messages?: Json;
          folder_id?: string | null;
          pinned?: boolean | null;
          shared?: boolean | null;
          unread?: boolean | null;
          tags?: string[] | null;
          settings?: Json;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'conversations_folder_id_fkey';
            columns: ['folder_id'];
            isOneToOne: false;
            referencedRelation: 'conversation_folders';
            referencedColumns: ['id'];
          }
        ];
      };

      /**
       * Conversation folders for organization
       */
      conversation_folders: {
        Row: {
          id: string;
          user_email: string;
          name: string;
          color: string;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_email: string;
          name: string;
          color?: string;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          user_email?: string;
          name?: string;
          color?: string;
          created_at?: string | null;
        };
        Relationships: [];
      };

      /**
       * Prompt templates library
       */
      prompt_templates: {
        Row: {
          id: string;
          user_email: string;
          title: string;
          description: string | null;
          content: string;
          category: string | null;
          tags: string[] | null;
          is_public: boolean | null;
          likes_count: number | null;
          uses_count: number | null;
          difficulty: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_email: string;
          title: string;
          description?: string | null;
          content: string;
          category?: string | null;
          tags?: string[] | null;
          is_public?: boolean | null;
          likes_count?: number | null;
          uses_count?: number | null;
          difficulty?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          user_email?: string;
          title?: string;
          description?: string | null;
          content?: string;
          category?: string | null;
          tags?: string[] | null;
          is_public?: boolean | null;
          likes_count?: number | null;
          uses_count?: number | null;
          difficulty?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };

      /**
       * Prompt likes tracking
       */
      prompt_likes: {
        Row: {
          user_email: string;
          prompt_id: string;
          created_at: string | null;
        };
        Insert: {
          user_email: string;
          prompt_id: string;
          created_at?: string | null;
        };
        Update: {
          user_email?: string;
          prompt_id?: string;
          created_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'prompt_likes_prompt_id_fkey';
            columns: ['prompt_id'];
            isOneToOne: false;
            referencedRelation: 'prompt_templates';
            referencedColumns: ['id'];
          }
        ];
      };

      /**
       * User automations
       */
      automations: {
        Row: {
          id: string;
          user_email: string;
          name: string;
          description: string | null;
          agent_id: string;
          enabled: boolean | null;
          last_run_at: string | null;
          total_runs: number | null;
          success_rate: number | null;
          trigger_config: Json;
          credential_id: string | null;
          model: string | null;
          template_id: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_email: string;
          name: string;
          description?: string | null;
          agent_id: string;
          enabled?: boolean | null;
          last_run_at?: string | null;
          total_runs?: number | null;
          success_rate?: number | null;
          trigger_config?: Json;
          credential_id?: string | null;
          model?: string | null;
          template_id?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          user_email?: string;
          name?: string;
          description?: string | null;
          agent_id?: string;
          enabled?: boolean | null;
          last_run_at?: string | null;
          total_runs?: number | null;
          success_rate?: number | null;
          trigger_config?: Json;
          credential_id?: string | null;
          model?: string | null;
          template_id?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'automations_credential_id_fkey';
            columns: ['credential_id'];
            isOneToOne: false;
            referencedRelation: 'edge_vault_credentials';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'automations_template_id_fkey';
            columns: ['template_id'];
            isOneToOne: false;
            referencedRelation: 'automation_templates';
            referencedColumns: ['id'];
          }
        ];
      };

      /**
       * Automation execution history
       */
      automation_executions: {
        Row: {
          id: string;
          automation_id: string | null;
          user_email: string;
          status: string | null;
          started_at: string | null;
          completed_at: string | null;
          input_data: Json | null;
          output_data: Json | null;
          error_message: string | null;
        };
        Insert: {
          id?: string;
          automation_id?: string | null;
          user_email: string;
          status?: string | null;
          started_at?: string | null;
          completed_at?: string | null;
          input_data?: Json | null;
          output_data?: Json | null;
          error_message?: string | null;
        };
        Update: {
          id?: string;
          automation_id?: string | null;
          user_email?: string;
          status?: string | null;
          started_at?: string | null;
          completed_at?: string | null;
          input_data?: Json | null;
          output_data?: Json | null;
          error_message?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'automation_executions_automation_id_fkey';
            columns: ['automation_id'];
            isOneToOne: false;
            referencedRelation: 'automations';
            referencedColumns: ['id'];
          }
        ];
      };

      /**
       * API usage tracking
       */
      usage: {
        Row: {
          id: string;
          email: string;
          model: string;
          model_provider: string | null;
          endpoint: string;
          tokens_in: number;
          tokens_out: number;
          cost_usd: number;
          latency_ms: number;
          status: 'success' | 'error' | 'blocked' | 'rate_limited';
          key_id: string | null;
          team_id: string | null;
          tag: string | null;
          metadata: Json | null;
          ts: string | null;
        };
        Insert: {
          id?: string;
          email: string;
          model: string;
          model_provider?: string | null;
          endpoint: string;
          tokens_in?: number;
          tokens_out?: number;
          cost_usd?: number;
          latency_ms?: number;
          status?: 'success' | 'error' | 'blocked' | 'rate_limited';
          key_id?: string | null;
          team_id?: string | null;
          tag?: string | null;
          metadata?: Json | null;
          ts?: string | null;
        };
        Update: {
          id?: string;
          email?: string;
          model?: string;
          model_provider?: string | null;
          endpoint?: string;
          tokens_in?: number;
          tokens_out?: number;
          cost_usd?: number;
          latency_ms?: number;
          status?: 'success' | 'error' | 'blocked' | 'rate_limited';
          key_id?: string | null;
          team_id?: string | null;
          tag?: string | null;
          metadata?: Json | null;
          ts?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'usage_key_id_fkey';
            columns: ['key_id'];
            isOneToOne: false;
            referencedRelation: 'virtual_keys';
            referencedColumns: ['id'];
          }
        ];
      };

      /**
       * Users table (shared)
       */
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          role: 'admin' | 'viewer' | 'user';
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          email: string;
          name: string;
          role?: 'admin' | 'viewer' | 'user';
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          role?: 'admin' | 'viewer' | 'user';
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
    };

    Views: {
      [_ in never]: never;
    };

    Functions: {
      is_oneedge_admin: {
        Args: { check_user_id: string };
        Returns: boolean;
      };
      get_current_user_role: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      increment_prompt_likes: {
        Args: { prompt_id: string };
        Returns: undefined;
      };
      decrement_prompt_likes: {
        Args: { prompt_id: string };
        Returns: undefined;
      };
      increment_prompt_uses: {
        Args: { prompt_id: string };
        Returns: undefined;
      };
      increment_template_usage: {
        Args: { template_id: string };
        Returns: undefined;
      };
    };

    Enums: {
      user_role: 'admin' | 'employee';
      integration_type: 'google' | 'slack' | 'jira' | 'n8n' | 'github' | 'notion' | 'custom';
      credential_status: 'active' | 'expired' | 'error' | 'revoked';
      automation_category: 'gsuite' | 'slack' | 'jira' | 'chat' | 'email' | 'custom';
      feed_source_type: 'api' | 'webhook' | 'rss';
      request_type: 'model' | 'tool';
      request_priority: 'low' | 'normal' | 'high' | 'urgent';
      request_status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'implemented';
      connection_status: 'connected' | 'disconnected' | 'error' | 'pending';
      difficulty_level: 'beginner' | 'intermediate' | 'advanced';
      usage_status: 'success' | 'error' | 'blocked' | 'rate_limited';
    };

    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

// ============================================================================
// HELPER TYPES
// ============================================================================

type PublicSchema = Database['public'];

/**
 * Extract Row type from a table
 */
export type Tables<T extends keyof PublicSchema['Tables']> =
  PublicSchema['Tables'][T]['Row'];

/**
 * Extract Insert type from a table
 */
export type TablesInsert<T extends keyof PublicSchema['Tables']> =
  PublicSchema['Tables'][T]['Insert'];

/**
 * Extract Update type from a table
 */
export type TablesUpdate<T extends keyof PublicSchema['Tables']> =
  PublicSchema['Tables'][T]['Update'];

/**
 * Extract Enum type
 */
export type Enums<T extends keyof PublicSchema['Enums']> =
  PublicSchema['Enums'][T];

// ============================================================================
// CONVENIENCE TYPE ALIASES
// ============================================================================

// OneEdge-specific table types
export type UserRole = Tables<'user_roles'>;
export type Agent = Tables<'agents'>;
export type EdgeVaultCredential = Tables<'edge_vault_credentials'>;
export type AutomationTemplate = Tables<'automation_templates'>;
export type PromptFeed = Tables<'prompt_feeds'>;
export type ExternalPrompt = Tables<'external_prompts'>;
export type AIGalleryRequest = Tables<'ai_gallery_requests'>;
export type N8nConfiguration = Tables<'n8n_configurations'>;
export type Project = Tables<'projects'>;
export type SiaMemory = Tables<'sia_memory'>;

// Shared table types
export type VirtualKey = Tables<'virtual_keys'>;
export type Model = Tables<'models'>;
export type Conversation = Tables<'conversations'>;
export type ConversationFolder = Tables<'conversation_folders'>;
export type PromptTemplate = Tables<'prompt_templates'>;
export type PromptLike = Tables<'prompt_likes'>;
export type Automation = Tables<'automations'>;
export type AutomationExecution = Tables<'automation_executions'>;
export type Usage = Tables<'usage'>;
export type User = Tables<'users'>;

// Insert types
export type AgentInsert = TablesInsert<'agents'>;
export type EdgeVaultCredentialInsert = TablesInsert<'edge_vault_credentials'>;
export type AutomationTemplateInsert = TablesInsert<'automation_templates'>;
export type PromptFeedInsert = TablesInsert<'prompt_feeds'>;
export type ExternalPromptInsert = TablesInsert<'external_prompts'>;
export type AIGalleryRequestInsert = TablesInsert<'ai_gallery_requests'>;
export type N8nConfigurationInsert = TablesInsert<'n8n_configurations'>;
export type ProjectInsert = TablesInsert<'projects'>;
export type SiaMemoryInsert = TablesInsert<'sia_memory'>;

// Update types
export type AgentUpdate = TablesUpdate<'agents'>;
export type EdgeVaultCredentialUpdate = TablesUpdate<'edge_vault_credentials'>;
export type AutomationTemplateUpdate = TablesUpdate<'automation_templates'>;
export type PromptFeedUpdate = TablesUpdate<'prompt_feeds'>;
export type ExternalPromptUpdate = TablesUpdate<'external_prompts'>;
export type AIGalleryRequestUpdate = TablesUpdate<'ai_gallery_requests'>;
export type N8nConfigurationUpdate = TablesUpdate<'n8n_configurations'>;
export type ProjectUpdate = TablesUpdate<'projects'>;
export type SiaMemoryUpdate = TablesUpdate<'sia_memory'>;

// Enum types
export type IntegrationType = Enums<'integration_type'>;
export type CredentialStatus = Enums<'credential_status'>;
export type AutomationCategory = Enums<'automation_category'>;
export type FeedSourceType = Enums<'feed_source_type'>;
export type RequestType = Enums<'request_type'>;
export type RequestPriority = Enums<'request_priority'>;
export type RequestStatus = Enums<'request_status'>;
export type ConnectionStatus = Enums<'connection_status'>;
export type DifficultyLevel = Enums<'difficulty_level'>;
export type UsageStatus = Enums<'usage_status'>;

// ============================================================================
// SIA MEMORY STRUCTURED TYPES
// ============================================================================

/**
 * Structured type for Sia memory data
 */
export interface SiaMemoryData {
  facts: SiaFact[];
  preferences: Record<string, unknown>;
  context: Record<string, unknown>;
  recentTopics: string[];
}

export interface SiaFact {
  id: string;
  content: string;
  category: 'personal' | 'work' | 'preference' | 'context';
  confidence: number;
  createdAt: string;
  lastReferencedAt: string;
}

// ============================================================================
// AGENT WORKFLOW STRUCTURED TYPES
// ============================================================================

/**
 * Structured type for agent workflow data (ReactFlow compatible)
 */
export interface AgentWorkflowData {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  viewport?: {
    x: number;
    y: number;
    zoom: number;
  };
}

export interface WorkflowNode {
  id: string;
  type: 'system' | 'tool' | 'router' | 'memory' | 'retrieval' | 'decision' | 'code' | 'human' | 'webhook' | 'delay' | 'output';
  position: { x: number; y: number };
  data: Record<string, unknown>;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  label?: string;
  type?: 'default' | 'conditional';
}

// ============================================================================
// AUTOMATION TEMPLATE STRUCTURED TYPES
// ============================================================================

/**
 * Structured type for automation template data
 */
export interface AutomationTemplateData {
  trigger: AutomationTrigger;
  steps: AutomationStep[];
  variables: AutomationVariable[];
}

export interface AutomationTrigger {
  type: 'schedule' | 'webhook' | 'email' | 'event' | 'manual';
  config: Record<string, unknown>;
}

export interface AutomationStep {
  id: string;
  type: 'ai_process' | 'send_email' | 'post_message' | 'create_doc' | 'api_call' | 'conditional';
  name: string;
  config: Record<string, unknown>;
}

export interface AutomationVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object';
  required: boolean;
  default?: unknown;
  description?: string;
}
