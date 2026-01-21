# OneEdge Implementation Plan

> **Created:** January 2025
> **Status:** Ready for Implementation
> **Total Phases:** 6

---

## Executive Summary

This plan addresses all changes requested in "Changes to Implement.md" with dedicated security, code quality, and real data validation checks for each phase.

### Key Principles
1. **No dummy data** - All data must come from and be validated against Supabase tables
2. **Security first** - RLS policies, input validation, secure credential storage
3. **Code quality** - TypeScript strict mode, proper error handling, clean abstractions
4. **Real-time sync** - Changes persist to Supabase immediately

---

## Phase 1: Database Schema & User Preferences Foundation

**Goal:** Create the database infrastructure for user settings, n8n credentials, and model preferences.

### 1.1 Create User Preferences Table
```sql
-- Migration: user_preferences table
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL UNIQUE,

  -- Chat Settings (from ChatSettingsDrawer)
  chat_system_prompt TEXT DEFAULT 'You are a helpful AI assistant.',
  chat_temperature NUMERIC(3,2) DEFAULT 0.7 CHECK (chat_temperature >= 0 AND chat_temperature <= 2),
  chat_max_tokens INTEGER DEFAULT 4000 CHECK (chat_max_tokens > 0 AND chat_max_tokens <= 128000),
  chat_top_p NUMERIC(3,2) DEFAULT 0.9 CHECK (chat_top_p >= 0 AND chat_top_p <= 1),
  chat_stream_response BOOLEAN DEFAULT true,

  -- N8N Configuration (migrated from localStorage)
  n8n_instance_url TEXT,
  n8n_api_key_encrypted TEXT,
  n8n_connected BOOLEAN DEFAULT false,
  n8n_last_sync_at TIMESTAMPTZ,

  -- Model Preferences
  default_model_id TEXT,
  preferred_coding_model TEXT,
  preferred_chat_model TEXT,
  preferred_image_model TEXT,

  -- UI Preferences
  theme TEXT DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
  sidebar_collapsed BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own preferences" ON public.user_preferences
  FOR SELECT USING (auth.jwt() ->> 'email' = user_email);

CREATE POLICY "Users can update own preferences" ON public.user_preferences
  FOR UPDATE USING (auth.jwt() ->> 'email' = user_email);

CREATE POLICY "Users can insert own preferences" ON public.user_preferences
  FOR INSERT WITH CHECK (auth.jwt() ->> 'email' = user_email);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_user_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_user_preferences_updated_at();
```

### 1.2 Create Model Ranking Function
```sql
-- Function to rank models based on query type
CREATE OR REPLACE FUNCTION public.get_ranked_models_for_query(
  p_user_email TEXT,
  p_query_type TEXT DEFAULT 'chat', -- 'chat', 'code', 'image', 'analysis'
  p_limit INTEGER DEFAULT 4
)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_agg(ranked_models) INTO result
  FROM (
    SELECT
      m.id,
      m.name,
      m.display_name,
      m.provider,
      m.api_path,
      m.kind,
      m.mode,
      m.context_length,
      m.max_tokens,
      m.cost_per_1k_input,
      m.cost_per_1k_output,
      CASE
        WHEN p_query_type = 'code' AND (m.kind ILIKE '%code%' OR m.name ILIKE '%code%') THEN 100
        WHEN p_query_type = 'image' AND (m.kind ILIKE '%vision%' OR m.mode ILIKE '%image%') THEN 100
        WHEN p_query_type = 'analysis' AND m.context_length > 32000 THEN 90
        WHEN p_query_type = 'chat' THEN 50
        ELSE 30
      END as relevance_score
    FROM public.models m
    INNER JOIN public.virtual_keys vk ON vk.email = p_user_email
    WHERE m.is_available = true
      AND (
        vk.models_json::text ILIKE '%' || m.name || '%'
        OR vk.models_json::text ILIKE '%all%'
      )
      AND vk.disabled = false
    ORDER BY relevance_score DESC, m.name ASC
    LIMIT p_limit
  ) as ranked_models;

  RETURN COALESCE(result, '[]'::json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Security Checks
- [ ] RLS policies enabled and tested
- [ ] N8N API key encrypted before storage (use pgcrypto)
- [ ] Input validation with CHECK constraints
- [ ] No SQL injection vectors in functions

### Code Quality Checks
- [ ] Types exported to TypeScript via `supabase gen types`
- [ ] Migration follows naming convention
- [ ] Rollback migration included

### Data Validation Checks
- [ ] All fields have appropriate constraints
- [ ] Foreign key to users table or email validation
- [ ] Default values are sensible

---

## Phase 2: Home Screen Improvements

**Goal:** Implement smart model selection based on query and add close button for comparison mode.

### 2.1 Create useModelRanking Hook
```typescript
// src/hooks/useModelRanking.ts
import { useCallback } from 'react';
import supabase from '@/services/supabaseClient';

interface RankedModel {
  id: string;
  name: string;
  display_name: string;
  provider: string;
  api_path: string;
  kind: string;
  mode: string;
  relevance_score: number;
}

export function useModelRanking(userEmail: string | undefined) {
  const getRankedModels = useCallback(async (query: string): Promise<RankedModel[]> => {
    if (!supabase || !userEmail) return [];

    // Analyze query to determine type
    const queryType = analyzeQueryType(query);

    const { data, error } = await supabase
      .rpc('get_ranked_models_for_query', {
        p_user_email: userEmail,
        p_query_type: queryType,
        p_limit: 4
      });

    if (error) {
      console.error('Failed to get ranked models:', error);
      return [];
    }

    return data || [];
  }, [userEmail]);

  return { getRankedModels };
}

function analyzeQueryType(query: string): 'code' | 'image' | 'analysis' | 'chat' {
  const lowerQuery = query.toLowerCase();

  // Code indicators
  if (/\b(code|function|class|debug|fix|implement|refactor|typescript|javascript|python|api|endpoint)\b/.test(lowerQuery)) {
    return 'code';
  }

  // Image indicators
  if (/\b(image|picture|photo|draw|generate|visual|design|ui|screenshot)\b/.test(lowerQuery)) {
    return 'image';
  }

  // Analysis indicators (long-form reasoning)
  if (/\b(analyze|compare|explain|research|summarize|review|evaluate|assess)\b/.test(lowerQuery)) {
    return 'analysis';
  }

  return 'chat';
}
```

### 2.2 Update Index.tsx with Close Button
```typescript
// Add to MultiModelComparison area
<Button
  variant="ghost"
  size="icon"
  onClick={handleCloseComparison}
  className="absolute top-4 right-4 h-10 w-10 rounded-full bg-background/80 backdrop-blur"
>
  <X className="h-5 w-5" />
</Button>
```

### 2.3 Update HomeAIInput to Use Smart Ranking
- Integrate `useModelRanking` hook
- Call `getRankedModels(query)` when user submits
- Pass ranked models to `MultiModelComparison`

### Security Checks
- [ ] Query analysis doesn't expose sensitive patterns
- [ ] RPC function called with proper authentication
- [ ] No PII logged in query analysis

### Code Quality Checks
- [ ] Hook follows React best practices (useCallback, proper deps)
- [ ] Error handling with user-friendly messages
- [ ] Loading states managed properly

### Data Validation Checks
- [ ] Models returned are from user's virtual keys only
- [ ] Empty state handled when no models available
- [ ] Invalid query types default to 'chat'

---

## Phase 3: Chat Page Enhancements

**Goal:** Fix animations, thinking mode, and persist settings to Supabase.

### 3.1 Create useUserPreferences Hook
```typescript
// src/hooks/useUserPreferences.ts
import { useState, useEffect, useCallback } from 'react';
import supabase from '@/services/supabaseClient';

interface UserPreferences {
  chat_system_prompt: string;
  chat_temperature: number;
  chat_max_tokens: number;
  chat_top_p: number;
  chat_stream_response: boolean;
  default_model_id: string | null;
  // ... other fields
}

export function useUserPreferences(userEmail: string | undefined) {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load preferences
  useEffect(() => {
    if (!supabase || !userEmail) {
      setLoading(false);
      return;
    }

    const loadPreferences = async () => {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_email', userEmail)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
        setError(error.message);
      } else {
        setPreferences(data || getDefaultPreferences());
      }
      setLoading(false);
    };

    loadPreferences();
  }, [userEmail]);

  // Update preferences
  const updatePreferences = useCallback(async (updates: Partial<UserPreferences>) => {
    if (!supabase || !userEmail) return { error: 'Not authenticated' };

    const { error } = await supabase
      .from('user_preferences')
      .upsert({
        user_email: userEmail,
        ...preferences,
        ...updates,
      }, {
        onConflict: 'user_email'
      });

    if (!error) {
      setPreferences(prev => prev ? { ...prev, ...updates } : null);
    }

    return { error: error?.message };
  }, [userEmail, preferences]);

  return { preferences, loading, error, updatePreferences };
}

function getDefaultPreferences(): UserPreferences {
  return {
    chat_system_prompt: 'You are a helpful AI assistant.',
    chat_temperature: 0.7,
    chat_max_tokens: 4000,
    chat_top_p: 0.9,
    chat_stream_response: true,
    default_model_id: null,
  };
}
```

### 3.2 Add Pulse Animation to Chat
```css
/* In Chat.tsx or global CSS */
@keyframes pulse-glow {
  0%, 100% {
    box-shadow: 0 0 20px 5px rgba(var(--primary-rgb), 0.3);
    transform: scale(1);
  }
  50% {
    box-shadow: 0 0 40px 10px rgba(var(--primary-rgb), 0.5);
    transform: scale(1.02);
  }
}

.chat-center-pulse {
  animation: pulse-glow 2s ease-in-out infinite;
}
```

### 3.3 Fix Thinking Mode
- Review ChatThread component for thinking mode logic
- Ensure streaming indicator works during "thinking"
- Add proper loading states with skeleton UI

### 3.4 Update ChatSettingsDrawer to Persist
```typescript
// In ChatSettingsDrawer.tsx
const handleSettingsChange = async (newSettings: ChatSettings) => {
  // Update local state immediately for responsiveness
  onSettingsChange(newSettings);

  // Persist to Supabase
  await updatePreferences({
    chat_system_prompt: newSettings.systemPrompt,
    chat_temperature: newSettings.temperature,
    chat_max_tokens: newSettings.maxTokens,
    chat_top_p: newSettings.topP,
    chat_stream_response: newSettings.streamResponse,
  });
};
```

### Security Checks
- [ ] Settings validated before Supabase insert
- [ ] Temperature/tokens within safe bounds
- [ ] System prompt sanitized (no injection)

### Code Quality Checks
- [ ] Animations use CSS transforms (GPU accelerated)
- [ ] No memory leaks in animation cleanup
- [ ] Debounce settings saves to avoid excessive writes

### Data Validation Checks
- [ ] Settings load from Supabase on mount
- [ ] Default values used when no saved preferences
- [ ] Settings persist across sessions

---

## Phase 4: Agents Page Redesign

**Goal:** Save n8n credentials to Supabase and add agent building/sharing capabilities.

### 4.1 Migrate n8n Credentials to Supabase
```typescript
// src/services/n8nService.ts - Updated

class N8NService {
  private userEmail: string | null = null;

  setUserEmail(email: string | null) {
    this.userEmail = email;
  }

  async getCredentials(): Promise<N8NCredentials | null> {
    if (!supabase || !this.userEmail) return null;

    const { data, error } = await supabase
      .from('user_preferences')
      .select('n8n_instance_url, n8n_api_key_encrypted, n8n_connected')
      .eq('user_email', this.userEmail)
      .single();

    if (error || !data?.n8n_instance_url) return null;

    // Decrypt API key (using Edge Function for security)
    const { data: decrypted } = await supabase.functions.invoke('decrypt_n8n_key', {
      body: { encrypted_key: data.n8n_api_key_encrypted }
    });

    return {
      url: data.n8n_instance_url,
      apiKey: decrypted?.api_key || ''
    };
  }

  async saveCredentials(credentials: N8NCredentials): Promise<{ error?: string }> {
    if (!supabase || !this.userEmail) {
      return { error: 'Not authenticated' };
    }

    // Encrypt API key via Edge Function
    const { data: encrypted, error: encryptError } = await supabase.functions.invoke('encrypt_n8n_key', {
      body: { api_key: credentials.apiKey }
    });

    if (encryptError) return { error: encryptError.message };

    const { error } = await supabase
      .from('user_preferences')
      .upsert({
        user_email: this.userEmail,
        n8n_instance_url: credentials.url,
        n8n_api_key_encrypted: encrypted.encrypted_key,
        n8n_connected: true,
        n8n_last_sync_at: new Date().toISOString()
      }, { onConflict: 'user_email' });

    // Clear localStorage fallback
    localStorage.removeItem('oneedge_n8n_credentials');

    return { error: error?.message };
  }

  async removeCredentials(): Promise<void> {
    if (!supabase || !this.userEmail) return;

    await supabase
      .from('user_preferences')
      .update({
        n8n_instance_url: null,
        n8n_api_key_encrypted: null,
        n8n_connected: false
      })
      .eq('user_email', this.userEmail);

    localStorage.removeItem('oneedge_n8n_credentials');
  }
}
```

### 4.2 Create Agent Builder Components
- Agent card with share toggle
- Agent workflow editor (simplified)
- Agent execution logs

### 4.3 Create agents Supabase Table (if not exists)
```sql
-- agents table for shareable agents
CREATE TABLE IF NOT EXISTS public.agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  model_id TEXT,
  workflow_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_shared BOOLEAN DEFAULT false,
  shared_with_team BOOLEAN DEFAULT false,
  n8n_workflow_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own agents" ON public.agents
  FOR ALL USING (auth.jwt() ->> 'email' = user_email);

CREATE POLICY "Users can view shared agents" ON public.agents
  FOR SELECT USING (is_shared = true);
```

### Security Checks
- [ ] API keys encrypted with pgcrypto/vault
- [ ] Decryption only via Edge Function with auth
- [ ] Shared agents don't expose credentials

### Code Quality Checks
- [ ] Migration from localStorage is seamless
- [ ] Graceful fallback if Supabase unavailable
- [ ] Proper TypeScript types for agents

### Data Validation Checks
- [ ] N8N URL validated as valid URL
- [ ] Agent names are unique per user
- [ ] Workflow data validated as JSON

---

## Phase 5: Automations Page Redesign

**Goal:** Comprehensive automation builder with real data from Supabase.

### 5.1 Review Existing Tables
The following tables already exist:
- `automation_rules` - User's automation rules
- `automation_templates` - Pre-built templates
- `automation_executions` - Execution history
- `integration_channels` - Available integrations
- `user_integrations` - User's connected integrations

### 5.2 Enhance Automation Builder
- Add MCP server integration
- Add agent selection (from Agents page)
- Add scheduled execution UI
- Add execution history view

### 5.3 Create Process Automation Components
```typescript
// Components to create:
// - AutomationFlowBuilder.tsx - Visual flow editor
// - AutomationTriggerConfig.tsx - Configure triggers
// - AutomationActionConfig.tsx - Configure actions
// - AutomationScheduler.tsx - Schedule automations
// - AutomationLogs.tsx - View execution logs
```

### Security Checks
- [ ] Automation rules validated before execution
- [ ] Rate limiting on automation triggers
- [ ] Credentials never exposed in logs

### Code Quality Checks
- [ ] Reusable components for trigger/action config
- [ ] Proper state management for complex flows
- [ ] Loading/error states for all async operations

### Data Validation Checks
- [ ] Templates loaded from Supabase (no hardcoded)
- [ ] User integrations verified before automation creation
- [ ] Execution logs stored in Supabase

---

## Phase 6: Model Hub Data Integrity

**Goal:** Ensure all model data flows from Supabase with proper endpoint tracking.

### 6.1 Create Model Endpoint Selector
```typescript
// src/hooks/useModelEndpoints.ts
export function useModelEndpoints(userEmail: string | undefined) {
  const [endpoints, setEndpoints] = useState<ModelEndpoint[]>([]);

  // Get model with all its endpoints
  const getModelEndpoints = useCallback(async (modelName: string) => {
    if (!supabase || !userEmail) return [];

    const { data, error } = await supabase
      .from('models')
      .select('*')
      .eq('name', modelName)
      .eq('is_available', true);

    if (error) return [];
    return data || [];
  }, [userEmail]);

  // Select best endpoint for query type
  const selectEndpoint = useCallback((model: ModelData, queryType: 'chat' | 'code' | 'image') => {
    // If model has specific api_path for query type, use it
    if (queryType === 'image' && model.mode?.includes('vision')) {
      return model.api_path || model.name;
    }
    if (queryType === 'code' && model.kind?.includes('code')) {
      return model.api_path || model.name;
    }
    return model.api_path || model.name;
  }, []);

  return { getModelEndpoints, selectEndpoint };
}
```

### 6.2 Update ModelsHub to Show Endpoint Details
- Display `api_path` for each model
- Show `kind` and `mode` badges
- Add endpoint availability indicator
- Show cost per 1k tokens

### 6.3 Update Chat to Auto-Select Endpoint
```typescript
// In Chat.tsx - when sending message
const handleSendMessage = async (content: string) => {
  const queryType = analyzeQueryType(content);
  const selectedModelData = models.find(m => m.id === selectedModel);

  if (selectedModelData) {
    // Check if selected model supports this query type
    const supportsQueryType = checkModelSupportsType(selectedModelData, queryType);

    if (!supportsQueryType) {
      toast({
        title: "Model Limitation",
        description: `${selectedModelData.name} doesn't support ${queryType} requests. Consider switching to a ${queryType}-capable model.`,
        variant: "warning"
      });
    }
  }

  await sendMessage(content);
};
```

### 6.4 Edge Function Validation
Ensure `employee_keys` Edge Function:
- Returns real model data from `models` table
- Includes `api_path`, `kind`, `mode` fields
- Filters by user's virtual key permissions

### Security Checks
- [ ] Model data only from authorized virtual keys
- [ ] API paths not exposed to unauthorized users
- [ ] Cost data accurate and from database

### Code Quality Checks
- [ ] No hardcoded model names/paths
- [ ] Proper loading states for model data
- [ ] Error handling for unavailable endpoints

### Data Validation Checks
- [ ] All model data comes from Supabase
- [ ] Edge function returns valid JSON
- [ ] Missing fields handled gracefully

---

## Implementation Checklist

### Phase 1: Database Schema ⬜
- [ ] Create migration file
- [ ] Apply migration to Supabase
- [ ] Generate TypeScript types
- [ ] Test RLS policies
- [ ] Create rollback migration

### Phase 2: Home Screen ⬜
- [ ] Create useModelRanking hook
- [ ] Add close button to comparison view
- [ ] Integrate smart model selection
- [ ] Test with real user data

### Phase 3: Chat Page ⬜
- [ ] Create useUserPreferences hook
- [ ] Add pulse animation CSS
- [ ] Fix thinking mode indicator
- [ ] Persist settings to Supabase
- [ ] Audit and simplify animations

### Phase 4: Agents Page ⬜
- [ ] Migrate n8n service to Supabase
- [ ] Create encryption Edge Functions
- [ ] Add agent builder UI
- [ ] Add sharing capabilities
- [ ] Test localStorage migration

### Phase 5: Automations Page ⬜
- [ ] Audit existing tables
- [ ] Enhance automation builder
- [ ] Add MCP/agent integration
- [ ] Add execution history
- [ ] Test with real templates

### Phase 6: Model Hub ⬜
- [ ] Create endpoint selector hook
- [ ] Update ModelsHub display
- [ ] Integrate auto-selection in Chat
- [ ] Validate Edge Function data
- [ ] Test all model types

---

## Testing Strategy

### Unit Tests
- All hooks have unit tests
- Supabase queries mocked
- Edge cases covered

### Integration Tests
- Full flow from UI to Supabase
- Real data validation
- RLS policy verification

### E2E Tests
- User journey for each feature
- Cross-browser testing
- Mobile responsiveness

---

## Rollback Plan

Each phase can be rolled back independently:
1. Database migrations have DOWN scripts
2. Feature flags for new UI components
3. localStorage fallback for n8n credentials
4. Version controlled deployment

---

## Success Metrics

1. **No dummy data** - Audit confirms all data from Supabase
2. **Settings persist** - User preferences survive logout/login
3. **N8N credentials secure** - API keys encrypted in database
4. **Smart model selection** - Appropriate models suggested for query types
5. **Animations smooth** - 60fps on all transitions
