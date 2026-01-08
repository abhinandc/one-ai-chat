# Data Model: OneEdge Platform

**Date**: 2025-01-08
**Status**: Complete

## Overview

This document defines all entities, relationships, and validation rules for the OneEdge platform. All tables use Supabase PostgreSQL with Row Level Security (RLS) enabled.

---

## Entity Relationship Diagram

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   auth.users    │────<│   app_users     │────<│  user_roles     │
│   (Supabase)    │     │  (profile)      │     │  (admin/emp)    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                      │                       │
         │                      │                       │
         ▼                      ▼                       │
┌─────────────────┐     ┌─────────────────┐            │
│  virtual_keys   │     │ user_preferences│            │
│  (from EdgeAdmin)│    │  (settings)     │            │
└─────────────────┘     └─────────────────┘            │
         │                                              │
         │                                              │
         ▼                                              │
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  conversations  │────<│  chat_messages  │     │ automation_     │
│  (threads)      │     │  (individual)   │     │ templates       │◄────────┘
└─────────────────┘     └─────────────────┘     │ (admin created) │
         │                                       └─────────────────┘
         │                                              │
         ▼                                              ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ conversation_   │     │   automations   │────<│ automation_     │
│ folders         │     │   (user)        │     │ executions      │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │
                               ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  prompt_feeds   │────<│ external_prompts│     │ edge_vault_     │
│  (admin config) │     │  (from feeds)   │     │ credentials     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                       │
         ┌─────────────────────────────────────────────┘
         ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│     agents      │     │ n8n_            │     │ ai_gallery_     │
│  (custom)       │     │ configurations  │     │ requests        │
└─────────────────┘     └─────────────────┘     └─────────────────┘

┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   projects      │     │  sia_memory     │     │ prompt_         │
│  (mobile org)   │     │  (persistent)   │     │ templates       │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

---

## Core Entities

### 1. app_users (User Profile)

**Purpose**: Extended user profile beyond Supabase auth

```typescript
interface AppUser {
  id: string;              // UUID, FK to auth.users
  email: string;           // From auth, denormalized
  display_name: string;    // User-editable name
  avatar_url?: string;     // Profile picture URL
  created_at: Date;
  updated_at: Date;
}
```

**Validation Rules**:
- `display_name`: 2-50 characters, alphanumeric + spaces
- `avatar_url`: Valid URL or null

**RLS Policy**: Users can only read/update their own profile

---

### 2. user_roles (Authorization)

**Purpose**: OneEdge-specific role assignment

```typescript
interface UserRole {
  id: string;              // UUID
  user_id: string;         // FK to auth.users, UNIQUE
  role: 'admin' | 'employee';
  created_at: Date;
  updated_at: Date;
}
```

**Validation Rules**:
- `role`: Must be 'admin' or 'employee'
- One role per user

**RLS Policy**: Users can view own role; admins can view all

---

### 3. virtual_keys (API Access)

**Purpose**: Model access allocation from EdgeAdmin

```typescript
interface VirtualKey {
  id: string;              // UUID
  user_id: string;         // FK to auth.users
  key_name: string;        // Display name
  models: string[];        // Allowed model IDs
  budget_limit?: number;   // Monthly spend limit
  current_usage: number;   // Current month spend
  is_active: boolean;
  expires_at?: Date;
  created_at: Date;
  updated_at: Date;
}
```

**Validation Rules**:
- `models`: Non-empty array of valid model identifiers
- `budget_limit`: Positive number or null (unlimited)
- `current_usage`: >= 0

**RLS Policy**: Users can only view their own keys

---

### 4. user_preferences (Settings)

**Purpose**: User customization settings

```typescript
interface UserPreferences {
  id: string;              // UUID
  user_id: string;         // FK to auth.users, UNIQUE
  theme: 'light' | 'dark' | 'system';
  default_model?: string;  // Preferred AI model
  sidebar_collapsed: boolean;
  notification_enabled: boolean;
  keyboard_shortcuts: boolean;
  created_at: Date;
  updated_at: Date;
}
```

**Validation Rules**:
- `theme`: One of allowed values
- `default_model`: Must exist in user's virtual_keys models

**RLS Policy**: Users manage own preferences only

---

## Chat Entities

### 5. conversations (Chat Threads)

**Purpose**: Container for chat messages

```typescript
interface Conversation {
  id: string;              // UUID
  user_id: string;         // FK to auth.users
  title: string;           // Auto-generated or user-set
  model: string;           // Model used for this conversation
  system_prompt?: string;  // Custom system message
  folder_id?: string;      // FK to conversation_folders
  is_pinned: boolean;
  is_archived: boolean;
  message_count: number;   // Denormalized count
  last_message_at?: Date;
  created_at: Date;
  updated_at: Date;
}
```

**Validation Rules**:
- `title`: 1-200 characters
- `model`: Must be valid model identifier
- `system_prompt`: Max 10,000 characters

**RLS Policy**: Users access own conversations only

---

### 6. chat_messages (Individual Messages)

**Purpose**: Store conversation messages

```typescript
interface ChatMessage {
  id: string;              // UUID
  conversation_id: string; // FK to conversations
  role: 'user' | 'assistant' | 'system';
  content: string;         // Message text (markdown)
  model?: string;          // Model that generated (for assistant)
  tokens_used?: number;    // Token count for this message
  cost?: number;           // Cost in cents
  metadata?: Record<string, unknown>; // Additional data
  created_at: Date;
}
```

**Validation Rules**:
- `role`: One of allowed values
- `content`: Non-empty, max 100,000 characters
- `tokens_used`: Non-negative integer
- `cost`: Non-negative number

**RLS Policy**: Users access messages in own conversations

---

### 7. conversation_folders (Organization)

**Purpose**: Organize conversations into folders

```typescript
interface ConversationFolder {
  id: string;              // UUID
  user_id: string;         // FK to auth.users
  name: string;
  color?: string;          // Hex color code
  icon?: string;           // Icon identifier
  parent_id?: string;      // FK to self (nested folders)
  sort_order: number;
  created_at: Date;
  updated_at: Date;
}
```

**Validation Rules**:
- `name`: 1-50 characters
- `color`: Valid hex color (#RRGGBB)
- `sort_order`: Non-negative integer

**RLS Policy**: Users manage own folders only

---

## Prompt Entities

### 8. prompt_templates (Personal Library)

**Purpose**: User-created prompt templates

```typescript
interface PromptTemplate {
  id: string;              // UUID
  user_id: string;         // FK to auth.users
  title: string;
  content: string;         // Prompt text with {{variables}}
  description?: string;
  category?: string;       // User-defined category
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  visibility: 'private' | 'team' | 'public';
  variables: PromptVariable[]; // Extracted from content
  usage_count: number;
  like_count: number;
  created_at: Date;
  updated_at: Date;
}

interface PromptVariable {
  name: string;
  description?: string;
  default_value?: string;
  type: 'text' | 'number' | 'select';
  options?: string[];      // For select type
}
```

**Validation Rules**:
- `title`: 1-100 characters
- `content`: Non-empty, max 50,000 characters
- `tags`: Max 10 tags, each max 30 characters
- `variables`: Auto-extracted from {{variable}} patterns

**RLS Policy**:
- Private: Owner only
- Team: All authenticated users
- Public: All authenticated users (read), owner (write)

---

### 9. prompt_feeds (External Sources)

**Purpose**: Admin-configured external prompt sources

```typescript
interface PromptFeed {
  id: string;              // UUID
  name: string;
  source_type: 'api' | 'webhook' | 'rss';
  source_url: string;
  api_key_encrypted?: string;
  refresh_interval_minutes: number;
  is_active: boolean;
  last_sync_at?: Date;
  last_sync_error?: string;
  created_by: string;      // FK to auth.users (admin)
  created_at: Date;
}
```

**Validation Rules**:
- `source_url`: Valid URL
- `refresh_interval_minutes`: 5-1440 (5 min to 24 hours)

**RLS Policy**: All can view active feeds; admins manage

---

### 10. external_prompts (Feed Content)

**Purpose**: Prompts fetched from external feeds

```typescript
interface ExternalPrompt {
  id: string;              // UUID
  feed_id: string;         // FK to prompt_feeds
  external_id: string;     // ID from source (for deduplication)
  title: string;
  content: string;
  author?: string;
  source_url?: string;     // Link to original
  tags: string[];
  fetched_at: Date;
}
```

**Validation Rules**:
- Unique constraint on (feed_id, external_id)

**RLS Policy**: All authenticated users can read

---

## Automation Entities

### 11. automation_templates (Admin Templates)

**Purpose**: Pre-built automation templates

```typescript
interface AutomationTemplate {
  id: string;              // UUID
  name: string;
  description?: string;
  category: 'gsuite' | 'slack' | 'jira' | 'chat' | 'custom';
  template_data: AutomationDefinition;
  required_credentials: string[]; // Integration types needed
  is_active: boolean;
  created_by: string;      // FK to auth.users (admin)
  created_at: Date;
  updated_at: Date;
}

interface AutomationDefinition {
  trigger: TriggerConfig;
  actions: ActionConfig[];
  model?: string;          // AI model to use
}
```

**Validation Rules**:
- `category`: One of allowed values
- `required_credentials`: Array of integration type strings

**RLS Policy**: All view active; admins manage

---

### 12. automations (User Instances)

**Purpose**: User-specific automation configurations

```typescript
interface Automation {
  id: string;              // UUID
  user_id: string;         // FK to auth.users
  template_id?: string;    // FK to automation_templates (null for custom)
  name: string;
  description?: string;
  config: AutomationDefinition;
  is_active: boolean;
  last_run_at?: Date;
  run_count: number;
  created_at: Date;
  updated_at: Date;
}
```

**Validation Rules**:
- `name`: 1-100 characters
- `config`: Valid automation definition

**RLS Policy**: Users manage own automations

---

### 13. automation_executions (Run History)

**Purpose**: Track automation runs

```typescript
interface AutomationExecution {
  id: string;              // UUID
  automation_id: string;   // FK to automations
  status: 'pending' | 'running' | 'success' | 'failed';
  started_at: Date;
  completed_at?: Date;
  duration_ms?: number;
  trigger_data?: Record<string, unknown>;
  result_data?: Record<string, unknown>;
  error_message?: string;
  tokens_used?: number;
  cost?: number;
}
```

**Validation Rules**:
- `status`: One of allowed values
- `duration_ms`: Non-negative

**RLS Policy**: Users view executions of own automations

---

## Agent Entities

### 14. agents (Custom Agents)

**Purpose**: User-created AI agent configurations

```typescript
interface Agent {
  id: string;              // UUID
  user_id: string;         // FK to auth.users
  name: string;
  description?: string;
  model: string;           // AI model to use
  workflow_data: AgentWorkflow;
  is_shared: boolean;
  shared_with: string[];   // User IDs with access
  created_at: Date;
  updated_at: Date;
}

interface AgentWorkflow {
  nodes: AgentNode[];
  edges: AgentEdge[];
  variables: Record<string, unknown>;
}

interface AgentNode {
  id: string;
  type: 'system' | 'tool' | 'router' | 'memory' | 'retrieval' |
        'decision' | 'code' | 'human' | 'webhook' | 'delay' | 'output';
  position: { x: number; y: number };
  data: Record<string, unknown>;
}
```

**Validation Rules**:
- `name`: 1-100 characters
- `model`: Valid model identifier
- `workflow_data`: Valid node/edge structure

**RLS Policy**: Owner or shared_with array members

---

### 15. n8n_configurations (n8n Integration)

**Purpose**: Per-user n8n instance configuration

```typescript
interface N8NConfiguration {
  id: string;              // UUID
  user_id: string;         // FK to auth.users, UNIQUE
  instance_url: string;    // n8n instance URL
  api_key_encrypted: string;
  webhook_url?: string;
  is_connected: boolean;
  last_sync_at?: Date;
  sync_error?: string;
  workflows_synced: number;
  created_at: Date;
  updated_at: Date;
}
```

**Validation Rules**:
- `instance_url`: Valid HTTPS URL
- One config per user

**RLS Policy**: Users manage own config

---

## Credential Entities

### 16. edge_vault_credentials (Secure Storage)

**Purpose**: Encrypted credential storage for integrations

```typescript
interface EdgeVaultCredential {
  id: string;              // UUID
  user_id: string;         // FK to auth.users
  integration_type: 'google' | 'slack' | 'jira' | 'n8n' | 'custom';
  label: string;           // User-friendly name
  encrypted_credentials: string; // AES-256 encrypted JSON
  status: 'active' | 'expired' | 'error';
  last_validated_at?: Date;
  created_at: Date;
  updated_at: Date;
}
```

**Validation Rules**:
- `integration_type`: One of allowed values
- `label`: 1-100 characters
- `encrypted_credentials`: Non-empty

**RLS Policy**: Users manage own credentials only

---

## AI Gallery Entities

### 17. ai_gallery_requests (Model/Tool Requests)

**Purpose**: User requests for new models or tools

```typescript
interface AIGalleryRequest {
  id: string;              // UUID
  user_id: string;         // FK to auth.users
  request_type: 'model' | 'tool';
  name: string;            // What they're requesting
  description: string;     // Why they need it
  justification?: string;  // Business case
  status: 'pending' | 'approved' | 'rejected';
  admin_notes?: string;    // Admin feedback
  reviewed_by?: string;    // FK to auth.users (admin)
  reviewed_at?: Date;
  created_at: Date;
}
```

**Validation Rules**:
- `name`: 1-100 characters
- `description`: 10-2000 characters

**RLS Policy**: Users manage own requests; admins can view/update all

---

## Mobile Entities

### 18. projects (Mobile Organization)

**Purpose**: Organize conversations in mobile app

```typescript
interface Project {
  id: string;              // UUID
  user_id: string;         // FK to auth.users
  name: string;
  description?: string;
  color: string;           // Hex color
  icon: string;            // Icon identifier
  conversation_ids: string[]; // FK array to conversations
  created_at: Date;
  updated_at: Date;
}
```

**Validation Rules**:
- `name`: 1-50 characters
- `color`: Valid hex color
- `icon`: Valid icon identifier

**RLS Policy**: Users manage own projects

---

### 19. sia_memory (Voice Assistant Memory)

**Purpose**: Persistent memory for Sia voice assistant

```typescript
interface SiaMemory {
  id: string;              // UUID
  user_id: string;         // FK to auth.users, UNIQUE
  memory_data: SiaMemoryData;
  summary?: string;        // Rolling conversation summary
  last_interaction_at?: Date;
  created_at: Date;
  updated_at: Date;
}

interface SiaMemoryData {
  user_facts: UserFact[];      // Things Sia learned
  preferences: Record<string, unknown>;
  recent_topics: string[];
  conversation_style?: string;
}

interface UserFact {
  fact: string;
  source: string;          // conversation_id
  learned_at: Date;
  confidence: number;      // 0-1
}
```

**Validation Rules**:
- One memory record per user
- `memory_data`: Valid JSON structure

**RLS Policy**: Users manage own memory

---

## Analytics Entities

### 20. usage_events (Activity Tracking)

**Purpose**: Track all significant user actions

```typescript
interface UsageEvent {
  id: string;              // UUID
  user_id: string;         // FK to auth.users
  event_type: string;      // 'chat_message', 'prompt_used', etc.
  event_data?: Record<string, unknown>;
  model?: string;
  tokens_used?: number;
  cost?: number;
  created_at: Date;
}
```

**RLS Policy**: Users view own events; admins view all

---

### 21. usage_summary (Aggregated Metrics)

**Purpose**: Pre-computed usage summaries

```typescript
interface UsageSummary {
  id: string;              // UUID
  user_id: string;         // FK to auth.users
  period: 'daily' | 'weekly' | 'monthly';
  period_start: Date;
  total_messages: number;
  total_tokens: number;
  total_cost: number;
  models_used: Record<string, number>; // model -> count
  top_model?: string;
  active_minutes: number;
  created_at: Date;
}
```

**RLS Policy**: Users view own summaries; admins view all

---

## Indexes

```sql
-- Performance indexes for common queries
CREATE INDEX idx_conversations_user_updated ON conversations(user_id, updated_at DESC);
CREATE INDEX idx_chat_messages_conversation ON chat_messages(conversation_id, created_at);
CREATE INDEX idx_prompt_templates_visibility ON prompt_templates(visibility, user_id);
CREATE INDEX idx_automations_user_active ON automations(user_id, is_active);
CREATE INDEX idx_usage_events_user_type ON usage_events(user_id, event_type, created_at DESC);

-- Full text search indexes
CREATE INDEX idx_conversations_title_fts ON conversations USING gin(to_tsvector('english', title));
CREATE INDEX idx_prompt_templates_content_fts ON prompt_templates USING gin(to_tsvector('english', content));
```

---

## TypeScript Generated Types

All entity types should be generated from the Supabase schema using:

```bash
npx supabase gen types typescript --project-id <project-id> > src/types/database.ts
```

This ensures type safety between database and application code per Constitution Principle I.
