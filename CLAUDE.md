# OneEdge - Product Requirements Document & Development Guide

> **Last Updated:** January 2025
> **Status:** Active Development
> **Platform:** Web (React/Vite) + Mobile (Flutter)

---

## Table of Contents

1. [Product Overview](#product-overview)
2. [Architecture](#architecture)
3. [Current State](#current-state)
4. [Target State](#target-state)
5. [Feature Specifications](#feature-specifications)
6. [Design System](#design-system)
7. [Database Schema](#database-schema)
8. [Mobile App Specifications](#mobile-app-specifications)
9. [Development Guardrails](#development-guardrails)
10. [API & Integrations](#api--integrations)

---

## Product Overview

### What is OneEdge?

OneEdge is an **employee-facing AI platform** that provides enterprise teams with controlled access to multiple AI models. It operates under the governance of **EdgeAdmin**, where administrators manage API keys, allocate model access to employees via virtual keys, and set usage limits (similar to LiteLLM proxy pattern).

### Key Stakeholders

| Role                         | Description                                                                                |
| ---------------------------- | ------------------------------------------------------------------------------------------ |
| **EdgeAdmin Administrators** | Manage API keys, create virtual keys, assign models to employees, set budgets/limits       |
| **OneEdge Admins**           | Internal admins who configure prompt feeds, automation templates, manage employee settings |
| **Employees**                | End users who consume AI services through chat, automations, and agents                    |

### Platform Distribution

| Platform        | Technology                   | Distribution                     |
| --------------- | ---------------------------- | -------------------------------- |
| **Web App**     | React 18 + Vite + TypeScript | Standard web deployment          |
| **iOS App**     | Flutter                      | TestFlight (internal)            |
| **Android App** | Flutter                      | Managed Google Play (enterprise) |

### Core Value Proposition

1. **Unified AI Access** - Single interface to access multiple AI models (Claude, GPT, Gemini, etc.)
2. **Enterprise Governance** - Centralized control over model access, budgets, and usage
3. **Process Automation** - AI-powered workflow automations integrated with enterprise stack
4. **Knowledge Sharing** - Internal prompt engineering community with curated external feeds
5. **Voice AI Assistant** - Sia, a persistent AI companion with ElevenLabs voice

---

## Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         EdgeAdmin                                │
│  (Separate App - Manages API Keys, Virtual Keys, Permissions)   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Supabase (Shared Database)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                          OneEdge                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Web App    │  │  iOS App     │  │ Android App  │          │
│  │ (React/Vite) │  │  (Flutter)   │  │  (Flutter)   │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Integrations                              │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐        │
│  │ GSuite │ │Rippling│ │  n8n   │ │  Jira  │ │ Slack  │        │
│  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘        │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow

```
EdgeAdmin                     Supabase                    OneEdge
    │                            │                           │
    │  1. Admin creates          │                           │
    │     virtual key ──────────►│                           │
    │                            │                           │
    │                            │  2. Employee logs in      │
    │                            │◄──────────────────────────│
    │                            │                           │
    │                            │  3. Fetch virtual keys    │
    │                            │     & permissions ───────►│
    │                            │                           │
    │                            │  4. Employee uses AI      │
    │                            │◄──────────────────────────│
    │                            │                           │
    │  5. Usage logged           │                           │
    │◄───────────────────────────│                           │
```

### Authentication Flow

1. Employee receives invite from EdgeAdmin
2. Employee signs up via Supabase Auth (Google SSO with GSuite enterprise)
3. OneEdge fetches user's virtual keys and model permissions from shared Supabase
4. RLS policies ensure data isolation per user/organization

---

## Current State

### Existing Web App Features

| Page                         | Current Status       | Functional                           |
| ---------------------------- | -------------------- | ------------------------------------ |
| Dashboard (`/`)              | Basic implementation | Partial - needs metrics overhaul     |
| Chat (`/chat`)               | Functional           | Yes - needs polish                   |
| Agents (`/agents`)           | Basic implementation | Partial - n8n integration incomplete |
| Automations (`/automations`) | Basic implementation | Partial - no templates               |
| Models Hub (`/models`)       | Functional           | Yes                                  |
| Prompt Library (`/prompts`)  | Functional           | Yes - needs community feeds          |
| Playground (`/playground`)   | Functional           | Yes - needs to merge into Prompts    |
| Tools Gallery (`/tools`)     | Basic implementation | Partial - rename to AI Gallery       |
| Help (`/help`)               | Static content       | Yes                                  |
| Theme (`/theme`)             | Design reference     | Dev only                             |
| Login                        | Google OAuth         | Needs Supabase SSO migration         |

### Existing Supabase Schema

**Tables Available:**

- `app_users` - User profiles
- `virtual_keys` - API key allocations from EdgeAdmin
- `user_preferences` - User settings
- `conversations` - Chat conversations
- `chat_messages` - Individual messages
- `conversation_folders` - Conversation organization
- `prompt_templates` - Prompt library
- `prompt_likes` / `prompt_usage` - Prompt engagement
- `automations` - Automation definitions
- `automation_executions` / `automation_logs` - Execution tracking
- `usage_events` / `activity_feed` / `usage_summary` - Analytics

### What's Missing

1. **Schema Additions Needed:**

   - `agents` - Custom agent definitions (shareable)
   - `agent_credentials` - EdgeVault secure credential storage
   - `automation_templates` - Pre-built automation templates
   - `prompt_feeds` - External community feed configurations
   - `ai_gallery_requests` - Model/tool request submissions
   - `n8n_configurations` - N8N sync parameters
   - `projects` - Mobile app project organization
   - `sia_memory` - Persistent Sia conversation memory

2. **Features Not Implemented:**
   - Dashboard Spotlight search with 4-model comparison
   - EdgeVault credential management
   - Automation template library
   - External prompt feed integration
   - AI Gallery (model/tool requests)
   - Sia voice assistant
   - Mobile app entirely

---

## Target State

### Web App Pages (Final Structure)

| Route          | Page           | Mobile  | Description                                   |
| -------------- | -------------- | ------- | --------------------------------------------- |
| `/`            | Dashboard      | No      | Metrics, Spotlight search, 4-model comparison |
| `/chat`        | Chat           | **Yes** | ChatGPT-style conversation interface          |
| `/agents`      | Agents         | No      | N8N config + custom agent builder             |
| `/automations` | Automations    | No      | Process automations with templates            |
| `/models`      | Models Hub     | No      | Model catalog, virtual keys display           |
| `/prompts`     | Prompt Library | No      | Prompts + Playground (merged) + community     |
| `/ai-gallery`  | AI Gallery     | No      | Model requests + tool requests                |
| `/help`        | Help & Profile | **Yes** | Documentation + user profile                  |
| `/admin`       | Admin Settings | No      | OneEdge admin config (admins only)            |

### Mobile App Pages (Flutter)

| Screen         | Description                                  |
| -------------- | -------------------------------------------- |
| **Home/Chats** | List of conversations, search, new chat      |
| **Chat**       | Active conversation with model switcher      |
| **Projects**   | Conversation folders/organization            |
| **Modes**      | Quick model presets (Thinking, Fast, Coding) |
| **Sia**        | Voice assistant interface                    |
| **Profile**    | Settings, preferences, help                  |

---

## Feature Specifications

### 1. Dashboard (Web Only)

#### Spotlight Search

- Mac-style search bar prominently centered
- AI analyzes query to understand user's task intent
- Automatically queries 4 relevant models in parallel
- Displays responses in comparison cards
- **CTA:** "Choose this response + [Model Name]"
- On selection: Animated transition to Chat page with conversation pre-populated

#### Metrics Dashboard

Display insane, useful metrics including:

- **Today's Stats:** Messages sent, tokens used, cost, active time
- **This Week:** Conversations started, models used, top model
- **Usage Trends:** Sparkline charts for daily/weekly activity
- **Budget Status:** Virtual key usage vs allocation
- **Model Performance:** Response times, success rates per model
- **Team Insights:** (If admin) Team usage patterns
- **Recent Activity:** Last 10 actions with quick-resume

#### Quick Actions

- Start new chat
- Resume last conversation
- Access favorite prompts
- Run frequent automations

### 2. Chat (Web + Mobile)

#### Web Features

- Conversation sidebar (collapsible)
- Model selector dropdown
- System prompt configuration
- Temperature/Max tokens controls
- Message threading with markdown rendering
- Code syntax highlighting
- File attachments (future)
- Conversation folders/tags
- Share conversation link
- Export as markdown/PDF

#### Mobile Features (ChatGPT-style)

- Bottom navigation: Chats | Sia | Projects | Profile
- Swipe gestures for conversation management
- Pull-to-refresh
- Model modes: Thinking | Fast | Coding
- Voice input (Sia integration)
- Dark/light theme (OKLCH colors)
- Haptic feedback
- Smooth 60fps animations

### 3. Agents (Web Only)

#### N8N Configuration Tab

- Connect to n8n instance (URL, API key)
- Sync workflows from n8n
- View workflow status (active/inactive)
- Test webhook triggers
- **No external editor** - all config in-app

#### Custom Agent Builder Tab

- Visual node-based editor (ReactFlow)
- Node types: System, Tool, Router, Memory, Retrieval, Decision, Code, Human, Webhook, Delay, Output
- Save/load agent workflows
- Share agents with team (opt-in)
- Assign model to agent
- Test agent execution

### 4. Automations (Web Only)

#### Automation Templates (Admin-Maintained)

Pre-built templates for enterprise stack:

**GSuite Automations:**

- "Email Summarizer" - Summarize unread emails daily
- "Email Forwarder" - Forward emails from specific sender to recipient
- "Calendar Prep" - Prepare meeting notes before calendar events
- "Doc Drafter" - Draft Google Docs from prompts
- "Sheet Analyzer" - Analyze Google Sheets data

**Slack Automations:**

- "Channel Summarizer" - Daily digest of channel activity
- "Customer Email Responder" - Draft responses to customer emails
- "Mention Alerter" - AI-summarized mention notifications

**Jira Automations:**

- "Ticket Prioritizer" - AI-prioritize new tickets
- "Sprint Reporter" - Generate sprint summary reports
- "Bug Analyzer" - Analyze bug patterns

**Google Chat Automations:**

- "Space Responder" - Draft responses to space messages
- "Meeting Scheduler" - AI-assisted meeting scheduling

**Custom Automations:**

- Visual builder for custom workflows
- Trigger types: Schedule, Webhook, Email, Event
- Action types: AI Process, Send Email, Post Message, Create Doc

#### EdgeVault (Credential Management)

- Secure credential storage per user
- Supported integrations: Google, Slack, Jira, n8n, custom OAuth
- Test & validate connections
- Credential sharing (team-level, admin-controlled)
- Audit log for credential access

#### Model Selection

- Each automation can use specific model
- Model selected from user's available models (virtual key)
- Default model fallback

### 5. Models Hub (Web Only)

#### Features

- View all available models (from virtual keys)
- Model details: capabilities, pricing, limits
- Usage per model (tokens, cost, requests)
- Model comparison tool
- Request new model access (→ AI Gallery)

### 6. Prompt Library + Playground (Web Only)

#### Prompt Library

- Create/edit/delete prompts
- Categories and tags
- Difficulty levels (beginner/intermediate/advanced)
- Like and usage tracking
- Share prompts (public/team/private)
- Template variables with fill-in forms

#### Playground (Integrated Section)

- Collapsible right panel OR dedicated tab
- Test prompts with different models
- Parameter adjustments (temp, tokens, top_p)
- Save playground sessions
- Export/share sessions

#### Community Feeds (Admin-Configured)

- External prompt sources via API/webhook
- Admin configures feed sources
- Employees can filter/browse external prompts
- Import external prompts to personal library

### 7. AI Gallery (Web Only)

Replaces "Tools Gallery" - now for requests:

#### Model Requests

- Request access to new models
- Business justification form
- Admin approval workflow
- Status tracking (pending/approved/rejected)

#### Tool Requests

- Request new AI tools (Cursor, Copilot, etc.)
- License request workflow
- Integration requests
- Status tracking

### 8. Help & Profile (Web + Mobile)

#### Help Section

- Searchable documentation
- Video tutorials
- FAQ accordion
- Contact support
- Keyboard shortcuts reference

#### Profile (Mobile-focused)

- Edit display name, avatar
- Theme preferences
- Notification settings
- Model defaults
- Sia voice settings
- Logout

### 9. Admin Settings (Web Only, Admins Only)

OneEdge-specific admin configuration:

#### Prompt Feed Management

- Add/remove external prompt sources
- Configure API endpoints or webhooks
- Set refresh intervals
- Enable/disable feeds for all employees

#### Automation Template Management

- Create/edit automation templates
- Set template visibility (all/specific teams)
- Template versioning

#### User Management

- View employees and their access
- Role assignment (admin/employee)
- Usage analytics per user

---

## Design System

### Web App Theme

**Style:** Clean, minimal, bold edge (shadcn + Radix)

**CSS Variables (Light):**

```css
:root {
  --radius: 0.5rem;
  --background: oklch(0.971 0.003 286.35);
  --foreground: oklch(0 0 0);
  --muted: oklch(0.923 0.007 286.267);
  --muted-foreground: oklch(0 0 0);
  --popover: oklch(1 0 180);
  --popover-foreground: oklch(0 0 0);
  --card: oklch(1 0 180);
  --card-foreground: oklch(0 0 0);
  --border: oklch(0.923 0.007 286.267);
  --input: oklch(0.923 0.007 286.267);
  --primary: oklch(0.603 0.218 257.42);
  --primary-foreground: oklch(1 0 180);
  --secondary: oklch(1 0 180);
  --secondary-foreground: oklch(0 0 0);
  --accent: oklch(0.963 0.007 286.274);
  --accent-foreground: oklch(0 0 0);
  --destructive: oklch(0.663 0.224 28.292);
  --destructive-foreground: oklch(1 0 180);
  --ring: oklch(0.603 0.218 257.42);
  --chart-1: oklch(0.73 0.194 147.443);
  --chart-2: oklch(0.865 0.177 90.382);
  --chart-3: oklch(0.659 0.172 263.904);
  --chart-4: oklch(0.529 0.191 278.337);
  --chart-5: oklch(0.65 0.238 17.899);
}
```

**CSS Variables (Dark):**

```css
.dark {
  --radius: 0.5rem;
  --background: oklch(0 0 0);
  --foreground: oklch(0.994 0 180);
  --muted: oklch(0.201 0.004 286.039);
  --muted-foreground: oklch(0.994 0 180);
  --popover: oklch(0.227 0.004 286.091);
  --popover-foreground: oklch(0.963 0.007 286.274);
  --card: oklch(0 0 0);
  --card-foreground: oklch(1 0 180);
  --border: oklch(0.201 0.002 286.221);
  --input: oklch(0.201 0.002 286.221);
  --primary: oklch(0.624 0.206 255.484);
  --primary-foreground: oklch(1 0 180);
  --secondary: oklch(0.227 0.004 286.091);
  --secondary-foreground: oklch(1 0 180);
  --accent: oklch(0.294 0.004 286.177);
  --accent-foreground: oklch(1 0 180);
  --destructive: oklch(0.648 0.207 30.78);
  --destructive-foreground: oklch(1 0 180);
  --ring: oklch(0.624 0.206 255.484);
  --chart-1: oklch(0.77 0.224 144.965);
  --chart-2: oklch(0.885 0.181 94.786);
  --chart-3: oklch(0.817 0.119 227.748);
  --chart-4: oklch(0.556 0.203 278.151);
  --chart-5: oklch(0.65 0.238 17.899);
}
```

### Mobile App Theme

**Theme 1 (Warm - Default):**

```css
:root {
  --primary: oklch(0.874 0.087 73.746);
  --primary-foreground: oklch(0.357 0.075 66.588);
  --secondary: oklch(0.785 0.111 24.334);
  --accent: oklch(0.954 0.122 111.787);
  /* See full theme in mobile specs */
}
```

**Theme 2 (Purple/Rose - Alternative):**

```css
:root {
  --primary: oklch(0.205 0.032 295.665);
  --secondary: oklch(0.868 0.011 298.338);
  /* See full theme in mobile specs */
}
```

### Design Resources

- **Icons:** Material Symbols via shadcn (`@shadcn/icons/material-symbols`)
- **Components:** shadcn/ui + Magic UI (`magicuidesign/magicui`)
- **Animations:** Animata (`codse/animata`)
- **Admin Reference:** shadcn-admin (`satnaing/shadcn-admin`)
- **Mobile Reference:** assistant-ui (`assistant-ui.com/examples`)

### Logo

- Light theme: `/public/logo-light.svg` (to be added)
- Dark theme: `/public/logo-dark.svg` (to be added)
- Favicon: `/public/favicon.svg` (exists)

---

## Database Schema

### New Tables Required

```sql
-- Agents (custom agent definitions)
CREATE TABLE IF NOT EXISTS public.agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  model TEXT NOT NULL,
  workflow_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_shared BOOLEAN DEFAULT FALSE,
  shared_with UUID[] DEFAULT '{}', -- user IDs who can access
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- EdgeVault Credentials
CREATE TABLE IF NOT EXISTS public.edge_vault_credentials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  integration_type TEXT NOT NULL, -- 'google', 'slack', 'jira', 'n8n', 'custom'
  label TEXT NOT NULL,
  encrypted_credentials TEXT NOT NULL, -- encrypted JSON
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'error')),
  last_validated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Automation Templates (admin-maintained)
CREATE TABLE IF NOT EXISTS public.automation_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- 'gsuite', 'slack', 'jira', 'chat', 'custom'
  template_data JSONB NOT NULL,
  required_credentials TEXT[] DEFAULT '{}', -- integration types needed
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Prompt Feeds (external sources)
CREATE TABLE IF NOT EXISTS public.prompt_feeds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('api', 'webhook', 'rss')),
  source_url TEXT NOT NULL,
  api_key_encrypted TEXT,
  refresh_interval_minutes INTEGER DEFAULT 60,
  is_active BOOLEAN DEFAULT TRUE,
  last_sync_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- External Prompts (from feeds)
CREATE TABLE IF NOT EXISTS public.external_prompts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  feed_id UUID NOT NULL REFERENCES public.prompt_feeds(id) ON DELETE CASCADE,
  external_id TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  author TEXT,
  source_url TEXT,
  tags TEXT[] DEFAULT '{}',
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(feed_id, external_id)
);

-- AI Gallery Requests
CREATE TABLE IF NOT EXISTS public.ai_gallery_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  request_type TEXT NOT NULL CHECK (request_type IN ('model', 'tool')),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  justification TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- N8N Configuration
CREATE TABLE IF NOT EXISTS public.n8n_configurations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  instance_url TEXT NOT NULL,
  api_key_encrypted TEXT NOT NULL,
  webhook_url TEXT,
  is_connected BOOLEAN DEFAULT FALSE,
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Projects (mobile app organization)
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#0066FF',
  icon TEXT DEFAULT 'folder',
  conversation_ids UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sia Memory (persistent assistant memory)
CREATE TABLE IF NOT EXISTS public.sia_memory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  memory_data JSONB NOT NULL DEFAULT '{}'::jsonb, -- structured memory
  summary TEXT, -- rolling summary of interactions
  last_interaction_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Roles (OneEdge admins vs employees)
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'employee' CHECK (role IN ('admin', 'employee')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies for new tables
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.edge_vault_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_feeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.external_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_gallery_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.n8n_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sia_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can manage own agents" ON public.agents
  FOR ALL USING (auth.uid() = user_id OR auth.uid() = ANY(shared_with));

CREATE POLICY "Users can manage own credentials" ON public.edge_vault_credentials
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Everyone can view active templates" ON public.automation_templates
  FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Admins can manage templates" ON public.automation_templates
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Everyone can view active feeds" ON public.prompt_feeds
  FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Admins can manage feeds" ON public.prompt_feeds
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Everyone can view external prompts" ON public.external_prompts
  FOR SELECT USING (TRUE);

CREATE POLICY "Users can manage own requests" ON public.ai_gallery_requests
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own n8n config" ON public.n8n_configurations
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own projects" ON public.projects
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own sia memory" ON public.sia_memory
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own role" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);
```

---

## Mobile App Specifications

### Technology Stack

- **Framework:** Flutter (latest stable)
- **State Management:** Riverpod or Bloc
- **Database:** Same Supabase project as web
- **Voice:** ElevenLabs SDK
- **Distribution:** TestFlight (iOS) + Managed Google Play (Android)

### Screen Flow

```
┌─────────────────────────────────────────────┐
│                  App Launch                  │
└─────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────┐
│              Authentication                  │
│         (Google SSO via Supabase)           │
└─────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────┐
│              Home (Chats List)              │
│  ┌─────────────────────────────────────┐    │
│  │ Search bar                          │    │
│  ├─────────────────────────────────────┤    │
│  │ Recent Chats                        │    │
│  │ - Chat 1 (GPT-4)         Yesterday  │    │
│  │ - Chat 2 (Claude)        2 days ago │    │
│  │ - Chat 3 (Gemini)        3 days ago │    │
│  └─────────────────────────────────────┘    │
│                                              │
│  ┌───────┬───────┬───────┬───────┐          │
│  │ Chats │  Sia  │Projects│Profile│          │
│  └───────┴───────┴───────┴───────┘          │
└─────────────────────────────────────────────┘
```

### Sia - Voice Assistant

#### Identity

- **Name:** Sia (Strategic Intelligence Assistant)
- **Voice:** Custom ElevenLabs voice (warm, professional, slightly playful)
- **Avatar:** Animated orb/waveform (similar to Siri but unique)
- **Personality:** Helpful, concise, occasionally witty

#### Capabilities

- Voice-to-voice conversations
- Persistent memory across sessions
- Context-aware responses (knows user's preferences, recent chats)
- Model switching mid-conversation
- Task delegation to automations

#### Technical Implementation

```dart
// ElevenLabs Agent integration
class SiaAgent {
  final ElevenLabsClient client;
  final SupabaseClient supabase;

  // Persistent memory from sia_memory table
  Future<SiaMemory> loadMemory(String userId);

  // Voice conversation
  Stream<AudioChunk> converse(AudioInput input);

  // Update memory after interaction
  Future<void> updateMemory(ConversationContext context);
}
```

### Mode Presets

| Mode         | Model                      | Temperature | Use Case                         |
| ------------ | -------------------------- | ----------- | -------------------------------- |
| **Thinking** | claude-3-opus              | 0.3         | Deep analysis, complex reasoning |
| **Fast**     | gpt-4o-mini / claude-haiku | 0.7         | Quick responses, casual chat     |
| **Coding**   | claude-3-sonnet / gpt-4    | 0.2         | Code generation, debugging       |

### Mobile Theme Implementation

```dart
// Flutter theme using OKLCH-equivalent colors
class OneEdgeTheme {
  static ThemeData light() => ThemeData(
    colorScheme: ColorScheme.light(
      primary: Color(0xFFE5A84B), // oklch(0.874 0.087 73.746)
      secondary: Color(0xFFD96B5C), // oklch(0.785 0.111 24.334)
      // ... etc
    ),
  );

  static ThemeData dark() => ThemeData(
    colorScheme: ColorScheme.dark(
      primary: Color(0xFFE5A84B),
      background: Color(0xFF1E1B17), // oklch(0.12 0.011 81.096)
      // ... etc
    ),
  );
}
```

---

## Development Guardrails

### Code Quality

1. **TypeScript Strict Mode** - All web code must pass `tsc --strict`
2. **Dart Analysis** - Flutter code must pass `flutter analyze` with no issues
3. **Test Coverage** - Minimum 70% coverage for critical paths
4. **Linting** - ESLint for web, `flutter_lints` for mobile

### Security

1. **Never commit secrets** - Use environment variables
2. **RLS always enabled** - All Supabase tables must have RLS
3. **Credential encryption** - EdgeVault credentials encrypted at rest
4. **Input validation** - All user inputs validated with Zod (web) / freezed (mobile)
5. **HTTPS only** - All API calls over HTTPS

### Performance

1. **Bundle size** - Web bundle < 500KB gzipped
2. **First paint** - < 1.5s on 3G
3. **60fps animations** - All animations must maintain 60fps
4. **Lazy loading** - Route-based code splitting

### Accessibility

1. **WCAG 2.1 AA** - Minimum compliance level
2. **Keyboard navigation** - All interactive elements focusable
3. **Screen reader** - Proper ARIA labels and roles
4. **Color contrast** - Minimum 4.5:1 for text

### Git Workflow

1. **Branch naming:** `feature/`, `fix/`, `refactor/`
2. **Commit messages:** Conventional commits format
3. **PR required** - No direct commits to main
4. **CI must pass** - All checks green before merge

### File Organization (Web)

```
src/
├── components/
│   ├── ui/           # shadcn/ui components
│   ├── shell/        # Layout components
│   ├── chat/         # Chat-specific components
│   ├── agents/       # Agent builder components
│   ├── automations/  # Automation components
│   └── modals/       # Modal dialogs
├── pages/            # Route components
├── hooks/            # Custom React hooks
├── services/         # API/Supabase services
├── types/            # TypeScript types
├── lib/              # Utility functions
└── styles/           # Global styles, themes
```

### File Organization (Mobile)

```
lib/
├── core/
│   ├── theme/        # Theme configuration
│   ├── routing/      # Navigation
│   └── di/           # Dependency injection
├── features/
│   ├── auth/         # Authentication
│   ├── chat/         # Chat feature
│   ├── sia/          # Sia voice assistant
│   └── projects/     # Project organization
├── shared/
│   ├── widgets/      # Reusable widgets
│   └── services/     # Shared services
└── main.dart
```

---

## API & Integrations

### Supabase

- **Project:** Shared with EdgeAdmin
- **Auth:** Google SSO (GSuite enterprise)
- **Database:** PostgreSQL with RLS
- **Storage:** For file attachments (future)
- **Edge Functions:** For secure credential operations

### AI Models (via LiteLLM-style proxy)

Access controlled by virtual keys from EdgeAdmin:

- OpenAI (GPT-4, GPT-4o, GPT-4o-mini)
- Anthropic (Claude 3 Opus, Sonnet, Haiku)
- Google (Gemini Pro, Gemini Flash)
- Meta (Llama 3)
- Others as enabled by EdgeAdmin

### ElevenLabs (Sia)

- **Voice Synthesis:** Custom voice for Sia
- **Speech-to-Text:** ElevenLabs input
- **Agent API:** For conversational AI

### n8n

- **Workflow sync:** Fetch workflows via n8n API
- **Webhook triggers:** For automation execution
- **Credential management:** Stored in EdgeVault

### Enterprise Stack

- **GSuite:** OAuth for access, Gmail/Calendar/Drive/Sheets APIs
- **Slack:** OAuth, message posting, event subscriptions
- **Jira:** OAuth, issue management
- **Rippling:** HR data (read-only)

---

## Implementation Priority

### Phase 1: Core Polish (Web)

1. Migrate auth to Supabase SSO
2. Implement new theme system (OKLCH)
3. Dashboard overhaul with Spotlight search
4. Chat UI polish and animations
5. Merge Playground into Prompt Library

### Phase 2: Enterprise Features (Web)

1. EdgeVault credential management
2. Automation templates
3. N8N configuration page
4. Admin settings page
5. AI Gallery (requests)

### Phase 3: Mobile MVP

1. Flutter project setup
2. Authentication flow
3. Chat interface
4. Projects organization
5. Basic Sia integration

### Phase 4: Mobile Polish

1. Full Sia voice implementation
2. Mode presets
3. Offline caching
4. Push notifications
5. App Store/Play Store prep

---

## Quick Reference

### Commands

```bash
# Web development
pnpm dev          # Start dev server
pnpm build        # Production build
pnpm typecheck    # TypeScript check
pnpm test         # Run tests
pnpm ci           # Full CI pipeline

# Mobile development
flutter run       # Run on device/emulator
flutter build     # Build for release
flutter test      # Run tests
flutter analyze   # Static analysis
```

### Key Files

| File                             | Purpose                |
| -------------------------------- | ---------------------- |
| `src/App.tsx`                    | Main routing           |
| `src/services/supabaseClient.ts` | Supabase configuration |
| `src/services/api.ts`            | AI model API client    |
| `src/hooks/useCurrentUser.ts`    | Authentication state   |
| `tailwind.config.ts`             | Theme configuration    |
| `supabase-schema.sql`            | Database schema        |

_This document is the source of truth for OneEdge development. Update as requirements evolve._
