export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      activity_events: {
        Row: {
          action: string
          id: string
          metadata: Json | null
          resource_id: string
          resource_type: string
          timestamp: string | null
          user_email: string
        }
        Insert: {
          action: string
          id?: string
          metadata?: Json | null
          resource_id: string
          resource_type: string
          timestamp?: string | null
          user_email: string
        }
        Update: {
          action?: string
          id?: string
          metadata?: Json | null
          resource_id?: string
          resource_type?: string
          timestamp?: string | null
          user_email?: string
        }
        Relationships: []
      }
      admin_settings: {
        Row: {
          created_at: string | null
          id: string
          key: string
          section: string
          updated_at: string | null
          value_json: Json
        }
        Insert: {
          created_at?: string | null
          id?: string
          key: string
          section: string
          updated_at?: string | null
          value_json?: Json
        }
        Update: {
          created_at?: string | null
          id?: string
          key?: string
          section?: string
          updated_at?: string | null
          value_json?: Json
        }
        Relationships: []
      }
      admin_users: {
        Row: {
          created_at: string | null
          email: string
          id: string
          is_vip: boolean | null
          last_login: string | null
          mfa_enabled: boolean | null
          name: string
          permissions: string[] | null
          role: string | null
          status: string | null
          tenant: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          is_vip?: boolean | null
          last_login?: string | null
          mfa_enabled?: boolean | null
          name: string
          permissions?: string[] | null
          role?: string | null
          status?: string | null
          tenant?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          is_vip?: boolean | null
          last_login?: string | null
          mfa_enabled?: boolean | null
          name?: string
          permissions?: string[] | null
          role?: string | null
          status?: string | null
          tenant?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      agent_workflows: {
        Row: {
          agent_id: string
          created_at: string | null
          description: string | null
          id: string
          name: string
          updated_at: string | null
          user_email: string
          workflow_data: Json
        }
        Insert: {
          agent_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string | null
          user_email: string
          workflow_data?: Json
        }
        Update: {
          agent_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
          user_email?: string
          workflow_data?: Json
        }
        Relationships: []
      }
      aliases: {
        Row: {
          alias: string
          created_at: string | null
          id: string
          model_names_json: Json
          updated_at: string | null
        }
        Insert: {
          alias: string
          created_at?: string | null
          id?: string
          model_names_json?: Json
          updated_at?: string | null
        }
        Update: {
          alias?: string
          created_at?: string | null
          id?: string
          model_names_json?: Json
          updated_at?: string | null
        }
        Relationships: []
      }
      api_usage_logs: {
        Row: {
          cost_usd: number | null
          id: string
          metadata: Json | null
          model: string
          request_type: string | null
          timestamp: string | null
          tokens_used: number
          user_email: string
        }
        Insert: {
          cost_usd?: number | null
          id?: string
          metadata?: Json | null
          model: string
          request_type?: string | null
          timestamp?: string | null
          tokens_used?: number
          user_email: string
        }
        Update: {
          cost_usd?: number | null
          id?: string
          metadata?: Json | null
          model?: string
          request_type?: string | null
          timestamp?: string | null
          tokens_used?: number
          user_email?: string
        }
        Relationships: []
      }
      automation_executions: {
        Row: {
          automation_id: string | null
          completed_at: string | null
          error_message: string | null
          id: string
          input_data: Json | null
          output_data: Json | null
          started_at: string | null
          status: string | null
          user_email: string
        }
        Insert: {
          automation_id?: string | null
          completed_at?: string | null
          error_message?: string | null
          id?: string
          input_data?: Json | null
          output_data?: Json | null
          started_at?: string | null
          status?: string | null
          user_email: string
        }
        Update: {
          automation_id?: string | null
          completed_at?: string | null
          error_message?: string | null
          id?: string
          input_data?: Json | null
          output_data?: Json | null
          started_at?: string | null
          status?: string | null
          user_email?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_executions_automation_id_fkey"
            columns: ["automation_id"]
            isOneToOne: false
            referencedRelation: "automations"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_templates: {
        Row: {
          category: string
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          required_credentials: string[] | null
          template_data: Json
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          required_credentials?: string[] | null
          template_data?: Json
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          required_credentials?: string[] | null
          template_data?: Json
          updated_at?: string | null
        }
        Relationships: []
      }
      automations: {
        Row: {
          agent_id: string
          created_at: string | null
          description: string | null
          enabled: boolean | null
          id: string
          last_run_at: string | null
          name: string
          success_rate: number | null
          total_runs: number | null
          trigger_config: Json | null
          user_email: string
        }
        Insert: {
          agent_id: string
          created_at?: string | null
          description?: string | null
          enabled?: boolean | null
          id?: string
          last_run_at?: string | null
          name: string
          success_rate?: number | null
          total_runs?: number | null
          trigger_config?: Json | null
          user_email: string
        }
        Update: {
          agent_id?: string
          created_at?: string | null
          description?: string | null
          enabled?: boolean | null
          id?: string
          last_run_at?: string | null
          name?: string
          success_rate?: number | null
          total_runs?: number | null
          trigger_config?: Json | null
          user_email?: string
        }
        Relationships: []
      }
      chat_conversations: {
        Row: {
          created_at: string | null
          id: string
          settings: Json | null
          title: string
          updated_at: string | null
          user_email: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          settings?: Json | null
          title: string
          updated_at?: string | null
          user_email: string
        }
        Update: {
          created_at?: string | null
          id?: string
          settings?: Json | null
          title?: string
          updated_at?: string | null
          user_email?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          conversation_id: string | null
          created_at: string | null
          id: string
          metadata_json: Json | null
          role: string
          user_email: string
        }
        Insert: {
          content: string
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          metadata_json?: Json | null
          role: string
          user_email: string
        }
        Update: {
          content?: string
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          metadata_json?: Json | null
          role?: string
          user_email?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_folders: {
        Row: {
          color: string
          created_at: string | null
          id: string
          name: string
          user_email: string
        }
        Insert: {
          color?: string
          created_at?: string | null
          id?: string
          name: string
          user_email: string
        }
        Update: {
          color?: string
          created_at?: string | null
          id?: string
          name?: string
          user_email?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          created_at: string | null
          folder_id: string | null
          id: string
          messages: Json
          pinned: boolean | null
          settings: Json
          shared: boolean | null
          tags: string[] | null
          title: string
          unread: boolean | null
          updated_at: string | null
          user_email: string
        }
        Insert: {
          created_at?: string | null
          folder_id?: string | null
          id?: string
          messages?: Json
          pinned?: boolean | null
          settings?: Json
          shared?: boolean | null
          tags?: string[] | null
          title: string
          unread?: boolean | null
          updated_at?: string | null
          user_email: string
        }
        Update: {
          created_at?: string | null
          folder_id?: string | null
          id?: string
          messages?: Json
          pinned?: boolean | null
          settings?: Json
          shared?: boolean | null
          tags?: string[] | null
          title?: string
          unread?: boolean | null
          updated_at?: string | null
          user_email?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "conversation_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      email_logs: {
        Row: {
          created_at: string | null
          data: Json | null
          id: string
          sent_at: string | null
          status: string
          subject: string
          template: string
          to_email: string
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          id?: string
          sent_at?: string | null
          status: string
          subject: string
          template: string
          to_email: string
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          id?: string
          sent_at?: string | null
          status?: string
          subject?: string
          template?: string
          to_email?: string
        }
        Relationships: []
      }
      guardrails: {
        Row: {
          config_json: Json
          created_at: string | null
          created_by: string | null
          description: string | null
          enabled: boolean
          id: string
          metadata_json: Json | null
          name: string
          priority: number | null
          rules_json: Json | null
          scope: string | null
          scope_key_ids: string[] | null
          team_id: string | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          config_json?: Json
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          enabled?: boolean
          id?: string
          metadata_json?: Json | null
          name: string
          priority?: number | null
          rules_json?: Json | null
          scope?: string | null
          scope_key_ids?: string[] | null
          team_id?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          config_json?: Json
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          enabled?: boolean
          id?: string
          metadata_json?: Json | null
          name?: string
          priority?: number | null
          rules_json?: Json | null
          scope?: string | null
          scope_key_ids?: string[] | null
          team_id?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "guardrails_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      guardrails_library: {
        Row: {
          category: string
          config_template: Json | null
          created_at: string | null
          default_action: string | null
          description: string | null
          documentation_url: string | null
          id: string
          is_builtin: boolean | null
          is_enterprise: boolean | null
          name: string
          provider: string | null
          severity: string | null
          tags: string[] | null
          type: string
          updated_at: string | null
        }
        Insert: {
          category: string
          config_template?: Json | null
          created_at?: string | null
          default_action?: string | null
          description?: string | null
          documentation_url?: string | null
          id?: string
          is_builtin?: boolean | null
          is_enterprise?: boolean | null
          name: string
          provider?: string | null
          severity?: string | null
          tags?: string[] | null
          type?: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          config_template?: Json | null
          created_at?: string | null
          default_action?: string | null
          description?: string | null
          documentation_url?: string | null
          id?: string
          is_builtin?: boolean | null
          is_enterprise?: boolean | null
          name?: string
          provider?: string | null
          severity?: string | null
          tags?: string[] | null
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      ip_allowlist: {
        Row: {
          cidr: string | null
          created_at: string | null
          created_by: string
          description: string | null
          enabled: boolean | null
          id: string
          ip_address: unknown
        }
        Insert: {
          cidr?: string | null
          created_at?: string | null
          created_by: string
          description?: string | null
          enabled?: boolean | null
          id?: string
          ip_address: unknown
        }
        Update: {
          cidr?: string | null
          created_at?: string | null
          created_by?: string
          description?: string | null
          enabled?: boolean | null
          id?: string
          ip_address?: unknown
        }
        Relationships: []
      }
      key_budget_allocations: {
        Row: {
          allowed_days: string[] | null
          allowed_hours_end: number | null
          allowed_hours_start: number | null
          created_at: string | null
          current_daily_spend: number | null
          current_daily_tokens: number | null
          current_monthly_spend: number | null
          current_monthly_tokens: number | null
          current_weekly_spend: number | null
          current_weekly_tokens: number | null
          daily_budget_usd: number | null
          daily_token_limit: number | null
          email: string | null
          hard_cap_enabled: boolean | null
          id: string
          key_id: string | null
          last_reset_daily: string | null
          last_reset_monthly: string | null
          last_reset_weekly: string | null
          monthly_budget_usd: number | null
          monthly_token_limit: number | null
          soft_cap_percentage: number | null
          updated_at: string | null
          weekly_budget_usd: number | null
          weekly_token_limit: number | null
        }
        Insert: {
          allowed_days?: string[] | null
          allowed_hours_end?: number | null
          allowed_hours_start?: number | null
          created_at?: string | null
          current_daily_spend?: number | null
          current_daily_tokens?: number | null
          current_monthly_spend?: number | null
          current_monthly_tokens?: number | null
          current_weekly_spend?: number | null
          current_weekly_tokens?: number | null
          daily_budget_usd?: number | null
          daily_token_limit?: number | null
          email?: string | null
          hard_cap_enabled?: boolean | null
          id?: string
          key_id?: string | null
          last_reset_daily?: string | null
          last_reset_monthly?: string | null
          last_reset_weekly?: string | null
          monthly_budget_usd?: number | null
          monthly_token_limit?: number | null
          soft_cap_percentage?: number | null
          updated_at?: string | null
          weekly_budget_usd?: number | null
          weekly_token_limit?: number | null
        }
        Update: {
          allowed_days?: string[] | null
          allowed_hours_end?: number | null
          allowed_hours_start?: number | null
          created_at?: string | null
          current_daily_spend?: number | null
          current_daily_tokens?: number | null
          current_monthly_spend?: number | null
          current_monthly_tokens?: number | null
          current_weekly_spend?: number | null
          current_weekly_tokens?: number | null
          daily_budget_usd?: number | null
          daily_token_limit?: number | null
          email?: string | null
          hard_cap_enabled?: boolean | null
          id?: string
          key_id?: string | null
          last_reset_daily?: string | null
          last_reset_monthly?: string | null
          last_reset_weekly?: string | null
          monthly_budget_usd?: number | null
          monthly_token_limit?: number | null
          soft_cap_percentage?: number | null
          updated_at?: string | null
          weekly_budget_usd?: number | null
          weekly_token_limit?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "key_budget_allocations_key_id_fkey"
            columns: ["key_id"]
            isOneToOne: false
            referencedRelation: "virtual_keys"
            referencedColumns: ["id"]
          },
        ]
      }
      llm_credentials: {
        Row: {
          api_key_encrypted: string | null
          created_at: string | null
          created_by: string | null
          endpoint_url: string | null
          id: string
          is_default: boolean | null
          name: string
          org_id: string | null
          project_id: string | null
          provider: string
          region: string | null
          team_id: string | null
          updated_at: string | null
        }
        Insert: {
          api_key_encrypted?: string | null
          created_at?: string | null
          created_by?: string | null
          endpoint_url?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          org_id?: string | null
          project_id?: string | null
          provider: string
          region?: string | null
          team_id?: string | null
          updated_at?: string | null
        }
        Update: {
          api_key_encrypted?: string | null
          created_at?: string | null
          created_by?: string | null
          endpoint_url?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          org_id?: string | null
          project_id?: string | null
          provider?: string
          region?: string | null
          team_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      logs: {
        Row: {
          app: string
          id: string
          json_payload: Json | null
          level: Database["public"]["Enums"]["log_level"]
          message: string
          ts: string | null
        }
        Insert: {
          app: string
          id?: string
          json_payload?: Json | null
          level: Database["public"]["Enums"]["log_level"]
          message: string
          ts?: string | null
        }
        Update: {
          app?: string
          id?: string
          json_payload?: Json | null
          level?: Database["public"]["Enums"]["log_level"]
          message?: string
          ts?: string | null
        }
        Relationships: []
      }
      mcp_server_tools: {
        Row: {
          created_at: string | null
          description: string | null
          enabled: boolean | null
          id: string
          input_schema: Json | null
          server_id: string | null
          tool_name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          enabled?: boolean | null
          id?: string
          input_schema?: Json | null
          server_id?: string | null
          tool_name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          enabled?: boolean | null
          id?: string
          input_schema?: Json | null
          server_id?: string | null
          tool_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "mcp_server_tools_server_id_fkey"
            columns: ["server_id"]
            isOneToOne: false
            referencedRelation: "mcp_servers"
            referencedColumns: ["id"]
          },
        ]
      }
      mcp_servers: {
        Row: {
          access_groups: string[] | null
          alias: string | null
          api_key: string | null
          assigned_models_json: Json | null
          auth_type: string | null
          base_url: string
          created_at: string | null
          created_by: string | null
          enabled: boolean
          health_status: string | null
          id: string
          metadata: Json | null
          name: string
          transport: string | null
          updated_at: string | null
        }
        Insert: {
          access_groups?: string[] | null
          alias?: string | null
          api_key?: string | null
          assigned_models_json?: Json | null
          auth_type?: string | null
          base_url: string
          created_at?: string | null
          created_by?: string | null
          enabled?: boolean
          health_status?: string | null
          id?: string
          metadata?: Json | null
          name: string
          transport?: string | null
          updated_at?: string | null
        }
        Update: {
          access_groups?: string[] | null
          alias?: string | null
          api_key?: string | null
          assigned_models_json?: Json | null
          auth_type?: string | null
          base_url?: string
          created_at?: string | null
          created_by?: string | null
          enabled?: boolean
          health_status?: string | null
          id?: string
          metadata?: Json | null
          name?: string
          transport?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      mcp_user_assignments: {
        Row: {
          created_at: string | null
          id: string
          server_id: string | null
          tools_allowed: string[] | null
          user_email: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          server_id?: string | null
          tools_allowed?: string[] | null
          user_email: string
        }
        Update: {
          created_at?: string | null
          id?: string
          server_id?: string | null
          tools_allowed?: string[] | null
          user_email?: string
        }
        Relationships: [
          {
            foreignKeyName: "mcp_user_assignments_server_id_fkey"
            columns: ["server_id"]
            isOneToOne: false
            referencedRelation: "mcp_servers"
            referencedColumns: ["id"]
          },
        ]
      }
      model_admin_settings: {
        Row: {
          allow_max_tokens_override: boolean | null
          allow_system_prompt_addition: boolean | null
          allow_temperature_override: boolean | null
          allow_top_k_override: boolean | null
          allow_top_p_override: boolean | null
          created_at: string | null
          default_frequency_penalty: number | null
          default_max_tokens: number | null
          default_presence_penalty: number | null
          default_temperature: number | null
          default_top_k: number | null
          default_top_p: number | null
          enabled: boolean | null
          guardrail_ids: string[] | null
          id: string
          max_max_tokens: number | null
          max_temperature: number | null
          max_top_p: number | null
          min_max_tokens: number | null
          min_temperature: number | null
          min_top_p: number | null
          model_id: string | null
          model_name: string
          system_prompt: string | null
          updated_at: string | null
        }
        Insert: {
          allow_max_tokens_override?: boolean | null
          allow_system_prompt_addition?: boolean | null
          allow_temperature_override?: boolean | null
          allow_top_k_override?: boolean | null
          allow_top_p_override?: boolean | null
          created_at?: string | null
          default_frequency_penalty?: number | null
          default_max_tokens?: number | null
          default_presence_penalty?: number | null
          default_temperature?: number | null
          default_top_k?: number | null
          default_top_p?: number | null
          enabled?: boolean | null
          guardrail_ids?: string[] | null
          id?: string
          max_max_tokens?: number | null
          max_temperature?: number | null
          max_top_p?: number | null
          min_max_tokens?: number | null
          min_temperature?: number | null
          min_top_p?: number | null
          model_id?: string | null
          model_name: string
          system_prompt?: string | null
          updated_at?: string | null
        }
        Update: {
          allow_max_tokens_override?: boolean | null
          allow_system_prompt_addition?: boolean | null
          allow_temperature_override?: boolean | null
          allow_top_k_override?: boolean | null
          allow_top_p_override?: boolean | null
          created_at?: string | null
          default_frequency_penalty?: number | null
          default_max_tokens?: number | null
          default_presence_penalty?: number | null
          default_temperature?: number | null
          default_top_k?: number | null
          default_top_p?: number | null
          enabled?: boolean | null
          guardrail_ids?: string[] | null
          id?: string
          max_max_tokens?: number | null
          max_temperature?: number | null
          max_top_p?: number | null
          min_max_tokens?: number | null
          min_temperature?: number | null
          min_top_p?: number | null
          model_id?: string | null
          model_name?: string
          system_prompt?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "model_admin_settings_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "model_health_status_view"
            referencedColumns: ["model_id"]
          },
          {
            foreignKeyName: "model_admin_settings_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "models"
            referencedColumns: ["id"]
          },
        ]
      }
      model_aliases: {
        Row: {
          alias: string
          created_at: string | null
          description: string | null
          id: string
          model_names_json: Json | null
          priority: number | null
          updated_at: string | null
        }
        Insert: {
          alias: string
          created_at?: string | null
          description?: string | null
          id?: string
          model_names_json?: Json | null
          priority?: number | null
          updated_at?: string | null
        }
        Update: {
          alias?: string
          created_at?: string | null
          description?: string | null
          id?: string
          model_names_json?: Json | null
          priority?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      model_analytics: {
        Row: {
          avg_latency_ms: number | null
          created_at: string | null
          date: string | null
          error_rate: number | null
          failed_requests: number | null
          id: string
          model_id: string | null
          model_name: string
          successful_requests: number | null
          total_cost: number | null
          total_requests: number | null
          total_tokens: number | null
        }
        Insert: {
          avg_latency_ms?: number | null
          created_at?: string | null
          date?: string | null
          error_rate?: number | null
          failed_requests?: number | null
          id?: string
          model_id?: string | null
          model_name: string
          successful_requests?: number | null
          total_cost?: number | null
          total_requests?: number | null
          total_tokens?: number | null
        }
        Update: {
          avg_latency_ms?: number | null
          created_at?: string | null
          date?: string | null
          error_rate?: number | null
          failed_requests?: number | null
          id?: string
          model_id?: string | null
          model_name?: string
          successful_requests?: number | null
          total_cost?: number | null
          total_requests?: number | null
          total_tokens?: number | null
        }
        Relationships: []
      }
      model_health_checks: {
        Row: {
          checked_at: string | null
          created_at: string | null
          error_message: string | null
          id: string
          model_id: string | null
          model_name: string | null
          response_time_ms: number | null
          status: string | null
        }
        Insert: {
          checked_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          model_id?: string | null
          model_name?: string | null
          response_time_ms?: number | null
          status?: string | null
        }
        Update: {
          checked_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          model_id?: string | null
          model_name?: string | null
          response_time_ms?: number | null
          status?: string | null
        }
        Relationships: []
      }
      model_health_status: {
        Row: {
          endpoint: string | null
          error_message: string | null
          id: string
          last_checked: string | null
          model_id: string | null
          model_name: string
          response_time_ms: number | null
          status: string | null
          uptime_percentage: number | null
        }
        Insert: {
          endpoint?: string | null
          error_message?: string | null
          id?: string
          last_checked?: string | null
          model_id?: string | null
          model_name: string
          response_time_ms?: number | null
          status?: string | null
          uptime_percentage?: number | null
        }
        Update: {
          endpoint?: string | null
          error_message?: string | null
          id?: string
          last_checked?: string | null
          model_id?: string | null
          model_name?: string
          response_time_ms?: number | null
          status?: string | null
          uptime_percentage?: number | null
        }
        Relationships: []
      }
      model_pricing_data: {
        Row: {
          audio_price_per_minute: number | null
          cached_input_price_per_1k: number | null
          currency: string | null
          id: string
          image_price_per_unit: number | null
          input_price_per_1k: number | null
          last_updated: string | null
          model_id: string | null
          model_name: string
          output_price_per_1k: number | null
          provider: string
        }
        Insert: {
          audio_price_per_minute?: number | null
          cached_input_price_per_1k?: number | null
          currency?: string | null
          id?: string
          image_price_per_unit?: number | null
          input_price_per_1k?: number | null
          last_updated?: string | null
          model_id?: string | null
          model_name: string
          output_price_per_1k?: number | null
          provider: string
        }
        Update: {
          audio_price_per_minute?: number | null
          cached_input_price_per_1k?: number | null
          currency?: string | null
          id?: string
          image_price_per_unit?: number | null
          input_price_per_1k?: number | null
          last_updated?: string | null
          model_id?: string | null
          model_name?: string
          output_price_per_1k?: number | null
          provider?: string
        }
        Relationships: []
      }
      model_retry_settings: {
        Row: {
          backoff_multiplier: number | null
          created_at: string | null
          custom_retry_codes: number[] | null
          id: string
          initial_delay_ms: number | null
          max_delay_ms: number | null
          max_retries: number | null
          model_id: string | null
          retry_on_rate_limit: boolean | null
          retry_on_server_error: boolean | null
          retry_on_timeout: boolean | null
          updated_at: string | null
        }
        Insert: {
          backoff_multiplier?: number | null
          created_at?: string | null
          custom_retry_codes?: number[] | null
          id?: string
          initial_delay_ms?: number | null
          max_delay_ms?: number | null
          max_retries?: number | null
          model_id?: string | null
          retry_on_rate_limit?: boolean | null
          retry_on_server_error?: boolean | null
          retry_on_timeout?: boolean | null
          updated_at?: string | null
        }
        Update: {
          backoff_multiplier?: number | null
          created_at?: string | null
          custom_retry_codes?: number[] | null
          id?: string
          initial_delay_ms?: number | null
          max_delay_ms?: number | null
          max_retries?: number | null
          model_id?: string | null
          retry_on_rate_limit?: boolean | null
          retry_on_server_error?: boolean | null
          retry_on_timeout?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      models: {
        Row: {
          api_key_encrypted: string | null
          api_path: string | null
          api_version: string | null
          config: Json | null
          context_length: number | null
          cost_per_1k_input: number | null
          cost_per_1k_output: number | null
          created_at: string | null
          description: string | null
          display_name: string | null
          endpoint_url: string | null
          features: string[] | null
          id: string
          is_available: boolean | null
          is_public: boolean | null
          kind: string | null
          max_tokens: number | null
          mode: string | null
          model_key: string | null
          name: string
          provider: string
          token_param: string | null
          updated_at: string | null
        }
        Insert: {
          api_key_encrypted?: string | null
          api_path?: string | null
          api_version?: string | null
          config?: Json | null
          context_length?: number | null
          cost_per_1k_input?: number | null
          cost_per_1k_output?: number | null
          created_at?: string | null
          description?: string | null
          display_name?: string | null
          endpoint_url?: string | null
          features?: string[] | null
          id?: string
          is_available?: boolean | null
          is_public?: boolean | null
          kind?: string | null
          max_tokens?: number | null
          mode?: string | null
          model_key?: string | null
          name: string
          provider?: string
          token_param?: string | null
          updated_at?: string | null
        }
        Update: {
          api_key_encrypted?: string | null
          api_path?: string | null
          api_version?: string | null
          config?: Json | null
          context_length?: number | null
          cost_per_1k_input?: number | null
          cost_per_1k_output?: number | null
          created_at?: string | null
          description?: string | null
          display_name?: string | null
          endpoint_url?: string | null
          features?: string[] | null
          id?: string
          is_available?: boolean | null
          is_public?: boolean | null
          kind?: string | null
          max_tokens?: number | null
          mode?: string | null
          model_key?: string | null
          name?: string
          provider?: string
          token_param?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      pass_through_endpoints: {
        Row: {
          allowed_methods: string[] | null
          auth_type: string | null
          created_at: string | null
          created_by: string | null
          enabled: boolean
          headers_json: Json | null
          id: string
          is_active: boolean | null
          last_health_checked_at: string | null
          last_health_status: string | null
          name: string
          path: string | null
          rate_limit_rpm: number | null
          strip_prefix: boolean | null
          target_url: string | null
          team_id: string | null
          updated_at: string | null
          url: string
        }
        Insert: {
          allowed_methods?: string[] | null
          auth_type?: string | null
          created_at?: string | null
          created_by?: string | null
          enabled?: boolean
          headers_json?: Json | null
          id?: string
          is_active?: boolean | null
          last_health_checked_at?: string | null
          last_health_status?: string | null
          name: string
          path?: string | null
          rate_limit_rpm?: number | null
          strip_prefix?: boolean | null
          target_url?: string | null
          team_id?: string | null
          updated_at?: string | null
          url: string
        }
        Update: {
          allowed_methods?: string[] | null
          auth_type?: string | null
          created_at?: string | null
          created_by?: string | null
          enabled?: boolean
          headers_json?: Json | null
          id?: string
          is_active?: boolean | null
          last_health_checked_at?: string | null
          last_health_status?: string | null
          name?: string
          path?: string | null
          rate_limit_rpm?: number | null
          strip_prefix?: boolean | null
          target_url?: string | null
          team_id?: string | null
          updated_at?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "pass_through_endpoints_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      playground_sessions: {
        Row: {
          created_at: string | null
          id: string
          model: string
          name: string
          parameters: Json | null
          prompt: string
          response: string | null
          user_email: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          model: string
          name: string
          parameters?: Json | null
          prompt: string
          response?: string | null
          user_email: string
        }
        Update: {
          created_at?: string | null
          id?: string
          model?: string
          name?: string
          parameters?: Json | null
          prompt?: string
          response?: string | null
          user_email?: string
        }
        Relationships: []
      }
      prompt_interactions: {
        Row: {
          id: string
          interaction_type: string
          prompt_id: string | null
          timestamp: string | null
          user_email: string
        }
        Insert: {
          id?: string
          interaction_type: string
          prompt_id?: string | null
          timestamp?: string | null
          user_email: string
        }
        Update: {
          id?: string
          interaction_type?: string
          prompt_id?: string | null
          timestamp?: string | null
          user_email?: string
        }
        Relationships: [
          {
            foreignKeyName: "prompt_interactions_prompt_id_fkey"
            columns: ["prompt_id"]
            isOneToOne: false
            referencedRelation: "prompt_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      prompt_likes: {
        Row: {
          created_at: string | null
          prompt_id: string
          user_email: string
        }
        Insert: {
          created_at?: string | null
          prompt_id: string
          user_email: string
        }
        Update: {
          created_at?: string | null
          prompt_id?: string
          user_email?: string
        }
        Relationships: [
          {
            foreignKeyName: "prompt_likes_prompt_id_fkey"
            columns: ["prompt_id"]
            isOneToOne: false
            referencedRelation: "prompt_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      prompt_templates: {
        Row: {
          category: string | null
          content: string
          created_at: string | null
          description: string | null
          difficulty: string | null
          id: string
          is_public: boolean | null
          likes_count: number | null
          tags: string[] | null
          title: string
          updated_at: string | null
          user_email: string
          uses_count: number | null
        }
        Insert: {
          category?: string | null
          content: string
          created_at?: string | null
          description?: string | null
          difficulty?: string | null
          id?: string
          is_public?: boolean | null
          likes_count?: number | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          user_email: string
          uses_count?: number | null
        }
        Update: {
          category?: string | null
          content?: string
          created_at?: string | null
          description?: string | null
          difficulty?: string | null
          id?: string
          is_public?: boolean | null
          likes_count?: number | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          user_email?: string
          uses_count?: number | null
        }
        Relationships: []
      }
      provider_billing: {
        Row: {
          api_key_id: string | null
          billing_cycle_end: string | null
          billing_cycle_start: string | null
          created_at: string | null
          credit_balance: number | null
          current_month_spend: number | null
          id: string
          last_invoice_amount: number | null
          last_invoice_date: string | null
          metadata: Json | null
          payment_method: string | null
          previous_month_spend: number | null
          provider: string
          updated_at: string | null
        }
        Insert: {
          api_key_id?: string | null
          billing_cycle_end?: string | null
          billing_cycle_start?: string | null
          created_at?: string | null
          credit_balance?: number | null
          current_month_spend?: number | null
          id?: string
          last_invoice_amount?: number | null
          last_invoice_date?: string | null
          metadata?: Json | null
          payment_method?: string | null
          previous_month_spend?: number | null
          provider: string
          updated_at?: string | null
        }
        Update: {
          api_key_id?: string | null
          billing_cycle_end?: string | null
          billing_cycle_start?: string | null
          created_at?: string | null
          credit_balance?: number | null
          current_month_spend?: number | null
          id?: string
          last_invoice_amount?: number | null
          last_invoice_date?: string | null
          metadata?: Json | null
          payment_method?: string | null
          previous_month_spend?: number | null
          provider?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      rippling_employees: {
        Row: {
          avatar_url: string | null
          created_at: string
          department: string | null
          email: string
          id: string
          manager_id: string | null
          name: string
          phone_number: string | null
          rippling_id: string
          start_date: string | null
          status: string
          synced_at: string
          timezone: string | null
          title: string | null
          work_location: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          department?: string | null
          email: string
          id?: string
          manager_id?: string | null
          name: string
          phone_number?: string | null
          rippling_id: string
          start_date?: string | null
          status?: string
          synced_at?: string
          timezone?: string | null
          title?: string | null
          work_location?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          department?: string | null
          email?: string
          id?: string
          manager_id?: string | null
          name?: string
          phone_number?: string | null
          rippling_id?: string
          start_date?: string | null
          status?: string
          synced_at?: string
          timezone?: string | null
          title?: string | null
          work_location?: string | null
        }
        Relationships: []
      }
      scim_config: {
        Row: {
          bearer_token: string | null
          created_at: string | null
          enabled: boolean | null
          endpoint_url: string | null
          group_provisioning: boolean | null
          id: string
          last_sync: string | null
          sync_interval: number | null
          sync_status: string | null
          updated_at: string | null
          user_provisioning: boolean | null
        }
        Insert: {
          bearer_token?: string | null
          created_at?: string | null
          enabled?: boolean | null
          endpoint_url?: string | null
          group_provisioning?: boolean | null
          id?: string
          last_sync?: string | null
          sync_interval?: number | null
          sync_status?: string | null
          updated_at?: string | null
          user_provisioning?: boolean | null
        }
        Update: {
          bearer_token?: string | null
          created_at?: string | null
          enabled?: boolean | null
          endpoint_url?: string | null
          group_provisioning?: boolean | null
          id?: string
          last_sync?: string | null
          sync_interval?: number | null
          sync_status?: string | null
          updated_at?: string | null
          user_provisioning?: boolean | null
        }
        Relationships: []
      }
      scim_groups: {
        Row: {
          external_id: string
          id: string
          members_json: Json | null
          name: string
          updated_at: string | null
        }
        Insert: {
          external_id: string
          id?: string
          members_json?: Json | null
          name: string
          updated_at?: string | null
        }
        Update: {
          external_id?: string
          id?: string
          members_json?: Json | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      scim_users: {
        Row: {
          active: boolean
          data_json: Json | null
          email: string
          external_id: string
          id: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean
          data_json?: Json | null
          email: string
          external_id: string
          id?: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean
          data_json?: Json | null
          email?: string
          external_id?: string
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      security_settings: {
        Row: {
          api_rate_limit: number | null
          audit_logging_enabled: boolean | null
          created_at: string | null
          id: string
          ip_restriction_enabled: boolean | null
          mfa_required: boolean | null
          password_policy: Json | null
          session_timeout: number | null
          updated_at: string | null
        }
        Insert: {
          api_rate_limit?: number | null
          audit_logging_enabled?: boolean | null
          created_at?: string | null
          id?: string
          ip_restriction_enabled?: boolean | null
          mfa_required?: boolean | null
          password_policy?: Json | null
          session_timeout?: number | null
          updated_at?: string | null
        }
        Update: {
          api_rate_limit?: number | null
          audit_logging_enabled?: boolean | null
          created_at?: string | null
          id?: string
          ip_restriction_enabled?: boolean | null
          mfa_required?: boolean | null
          password_policy?: Json | null
          session_timeout?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      sso_configs: {
        Row: {
          config: Json | null
          created_at: string | null
          domains: string[] | null
          enabled: boolean | null
          id: string
          name: string
          provider: string
          updated_at: string | null
        }
        Insert: {
          config?: Json | null
          created_at?: string | null
          domains?: string[] | null
          enabled?: boolean | null
          id?: string
          name: string
          provider: string
          updated_at?: string | null
        }
        Update: {
          config?: Json | null
          created_at?: string | null
          domains?: string[] | null
          enabled?: boolean | null
          id?: string
          name?: string
          provider?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      team_invitations: {
        Row: {
          created_at: string | null
          email: string
          expires_at: string
          id: string
          invited_by: string
          role: string
          status: string
          team_id: string
          token: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          expires_at: string
          id?: string
          invited_by: string
          role: string
          status?: string
          team_id: string
          token: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          role?: string
          status?: string
          team_id?: string
          token?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_invitations_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          created_at: string | null
          email: string
          id: string
          invited_at: string | null
          invited_by: string | null
          last_active: string | null
          name: string | null
          role: string
          status: string
          team_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          last_active?: string | null
          name?: string | null
          role: string
          status?: string
          team_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          last_active?: string | null
          name?: string | null
          role?: string
          status?: string
          team_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          owner_id: string
          settings: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id: string
          name: string
          owner_id: string
          settings?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          owner_id?: string
          settings?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      tool_installations: {
        Row: {
          agent_id: string
          configuration: Json | null
          id: string
          installed_at: string | null
          status: string | null
          tool_name: string
          user_email: string
        }
        Insert: {
          agent_id: string
          configuration?: Json | null
          id?: string
          installed_at?: string | null
          status?: string | null
          tool_name: string
          user_email: string
        }
        Update: {
          agent_id?: string
          configuration?: Json | null
          id?: string
          installed_at?: string | null
          status?: string | null
          tool_name?: string
          user_email?: string
        }
        Relationships: []
      }
      tool_submissions: {
        Row: {
          category: string
          description: string
          id: string
          implementation: string
          name: string
          status: string | null
          submitted_at: string | null
          user_email: string
        }
        Insert: {
          category: string
          description: string
          id?: string
          implementation: string
          name: string
          status?: string | null
          submitted_at?: string | null
          user_email: string
        }
        Update: {
          category?: string
          description?: string
          id?: string
          implementation?: string
          name?: string
          status?: string | null
          submitted_at?: string | null
          user_email?: string
        }
        Relationships: []
      }
      usage: {
        Row: {
          cost_usd: number
          email: string
          endpoint: string
          id: string
          key_id: string | null
          latency_ms: number
          metadata: Json | null
          model: string
          model_provider: string | null
          status: Database["public"]["Enums"]["usage_status"]
          tag: string | null
          team_id: string | null
          tokens_in: number
          tokens_out: number
          ts: string | null
        }
        Insert: {
          cost_usd?: number
          email: string
          endpoint: string
          id?: string
          key_id?: string | null
          latency_ms?: number
          metadata?: Json | null
          model: string
          model_provider?: string | null
          status?: Database["public"]["Enums"]["usage_status"]
          tag?: string | null
          team_id?: string | null
          tokens_in?: number
          tokens_out?: number
          ts?: string | null
        }
        Update: {
          cost_usd?: number
          email?: string
          endpoint?: string
          id?: string
          key_id?: string | null
          latency_ms?: number
          metadata?: Json | null
          model?: string
          model_provider?: string | null
          status?: Database["public"]["Enums"]["usage_status"]
          tag?: string | null
          team_id?: string | null
          tokens_in?: number
          tokens_out?: number
          ts?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "usage_key_id_fkey"
            columns: ["key_id"]
            isOneToOne: false
            referencedRelation: "virtual_keys"
            referencedColumns: ["id"]
          },
        ]
      }
      user_agent_activity: {
        Row: {
          action: string
          email: string
          environment: string | null
          id: string
          meta_json: Json | null
          team_id: string | null
          ts: string | null
        }
        Insert: {
          action: string
          email: string
          environment?: string | null
          id?: string
          meta_json?: Json | null
          team_id?: string | null
          ts?: string | null
        }
        Update: {
          action?: string
          email?: string
          environment?: string | null
          id?: string
          meta_json?: Json | null
          team_id?: string | null
          ts?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string | null
          email: string
          id: string
          name: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          name: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          name?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Relationships: []
      }
      virtual_keys: {
        Row: {
          admin_virtual_key_id: string | null
          budget_usd: number
          created_at: string | null
          disabled: boolean
          email: string
          expires_at: string | null
          id: string
          key_hash: string
          key_prefix: string | null
          label: string
          masked_key: string | null
          models_json: Json
          rpd: number
          rpm: number
          tags_json: Json | null
          team_id: string | null
          tpd: number
          tpm: number
        }
        Insert: {
          admin_virtual_key_id?: string | null
          budget_usd?: number
          created_at?: string | null
          disabled?: boolean
          email: string
          expires_at?: string | null
          id?: string
          key_hash: string
          key_prefix?: string | null
          label: string
          masked_key?: string | null
          models_json?: Json
          rpd?: number
          rpm?: number
          tags_json?: Json | null
          team_id?: string | null
          tpd?: number
          tpm?: number
        }
        Update: {
          admin_virtual_key_id?: string | null
          budget_usd?: number
          created_at?: string | null
          disabled?: boolean
          email?: string
          expires_at?: string | null
          id?: string
          key_hash?: string
          key_prefix?: string | null
          label?: string
          masked_key?: string | null
          models_json?: Json
          rpd?: number
          rpm?: number
          tags_json?: Json | null
          team_id?: string | null
          tpd?: number
          tpm?: number
        }
        Relationships: []
      }
    }
    Views: {
      model_health_status_view: {
        Row: {
          error_message: string | null
          health_status: string | null
          is_available: boolean | null
          last_checked: string | null
          model_id: string | null
          model_name: string | null
          provider: string | null
          response_time_ms: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      current_jwt_claim: { Args: { claim: string }; Returns: string }
      current_team_id: { Args: never; Returns: string }
      current_user_email: { Args: never; Returns: string }
      decrement_prompt_likes: {
        Args: { prompt_id: string }
        Returns: undefined
      }
      get_available_models: { Args: never; Returns: Json }
      get_dashboard_stats: { Args: { p_user_email: string }; Returns: Json }
      get_employee_key: {
        Args: { p_email: string; p_key_id: string }
        Returns: Json
      }
      get_employee_keys: { Args: { p_email: string }; Returns: Json }
      get_user_usage_metrics: { Args: { p_user_email: string }; Returns: Json }
      increment_prompt_likes: {
        Args: { prompt_id: string }
        Returns: undefined
      }
      increment_prompt_uses: { Args: { prompt_id: string }; Returns: undefined }
      is_admin_user:
        | { Args: { user_email: string }; Returns: boolean }
        | { Args: { user_id: string }; Returns: boolean }
      record_key_usage: {
        Args: {
          p_cost_usd?: number
          p_key_id: string
          p_latency_ms?: number
          p_model: string
          p_status?: string
          p_tokens_in?: number
          p_tokens_out?: number
        }
        Returns: Json
      }
      update_automation_stats: {
        Args: { automation_id: string; success: boolean }
        Returns: undefined
      }
      user_owns_key: { Args: { key_id_param: string }; Returns: boolean }
      validate_api_key: { Args: { p_key_hash: string }; Returns: Json }
    }
    Enums: {
      log_level: "DEBUG" | "INFO" | "WARNING" | "ERROR" | "CRITICAL"
      team_member_status: "pending" | "accepted" | "declined" | "removed"
      usage_status: "success" | "error" | "blocked" | "rate_limited"
      user_role: "admin" | "viewer" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      log_level: ["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"],
      team_member_status: ["pending", "accepted", "declined", "removed"],
      usage_status: ["success", "error", "blocked", "rate_limited"],
      user_role: ["admin", "viewer", "user"],
    },
  },
} as const
