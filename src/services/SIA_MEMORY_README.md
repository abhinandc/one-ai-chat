# Sia Memory Service

Persistent memory management for Sia voice assistant in OneEdge platform.

## Overview

The Sia Memory Service provides a complete solution for managing Sia's persistent memory across user sessions. It handles conversation history, learned facts, user preferences, and contextual information.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Sia Voice Assistant                       │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  Sia Memory Service                          │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ • Load Memory     • Update Memory                      │ │
│  │ • Clear Memory    • Get Summary                        │ │
│  │ • Manage Facts    • Update Preferences                 │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                 Supabase (sia_memory table)                  │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ • memory_data (JSONB)                                  │ │
│  │ • summary (TEXT)                                       │ │
│  │ • personality_adjustments (JSONB)                      │ │
│  │ • total_interactions (INTEGER)                         │ │
│  │ • last_interaction_at (TIMESTAMPTZ)                    │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Memory Data Structure

The `memory_data` JSONB field contains:

```typescript
{
  "facts": [
    {
      "id": "uuid",
      "content": "User prefers concise responses",
      "category": "preference",  // 'personal' | 'work' | 'preference' | 'context'
      "confidence": 0.95,        // 0-1 confidence score
      "createdAt": "2026-01-09T...",
      "lastReferencedAt": "2026-01-09T..."
    }
  ],
  "preferences": {
    "responseStyle": "concise",
    "voiceSpeed": "normal",
    "topics": ["technology", "AI"]
  },
  "context": {
    "lastMessage": "...",
    "lastResponse": "...",
    "lastInteractionAt": "2026-01-09T..."
  },
  "recentTopics": [
    "AI development",
    "Project management",
    "Data analysis"
  ]
}
```

## Service API

### Core Methods

#### `loadMemory(userId: string): Promise<SiaMemory>`
Load Sia memory for a user. Creates default memory if none exists.

```typescript
const memory = await siaMemoryService.loadMemory(userId);
console.log(memory.total_interactions); // 42
```

#### `updateMemory(userId: string, context: SiaInteractionContext): Promise<SiaMemory>`
Update memory after a Sia interaction.

```typescript
await siaMemoryService.updateMemory(userId, {
  message: "What's the weather like?",
  response: "I can't check weather, but I can help with other tasks!",
  topic: "Weather queries",
  facts: [
    {
      content: "User asked about weather",
      category: "context",
      confidence: 1.0
    }
  ],
  preferences: {
    interestedInWeather: true
  }
});
```

#### `getMemorySummary(userId: string): Promise<string | null>`
Get a rolling summary of user interactions.

```typescript
const summary = await siaMemoryService.getMemorySummary(userId);
// "Sia has had 42 interactions with you, learning 15 facts and discussing 8 recent topics."
```

#### `clearMemory(userId: string): Promise<void>`
Clear all memory for a user (destructive operation).

```typescript
await siaMemoryService.clearMemory(userId);
```

### Fact Management

#### `getFactsByCategory(userId: string, category: SiaFact['category']): Promise<SiaFact[]>`
Get facts filtered by category.

```typescript
const preferences = await siaMemoryService.getFactsByCategory(userId, 'preference');
```

#### `removeFact(userId: string, factId: string): Promise<SiaMemory>`
Remove a specific fact from memory.

```typescript
await siaMemoryService.removeFact(userId, factId);
```

### Preferences Management

#### `getPreferences(userId: string): Promise<Record<string, unknown>>`
Get user preferences from memory.

```typescript
const prefs = await siaMemoryService.getPreferences(userId);
console.log(prefs.responseStyle); // "concise"
```

#### `updatePreferences(userId: string, preferences: Record<string, unknown>): Promise<SiaMemory>`
Update user preferences.

```typescript
await siaMemoryService.updatePreferences(userId, {
  voiceSpeed: "fast",
  theme: "dark"
});
```

### Personality Management

#### `updatePersonality(userId: string, adjustments: Record<string, unknown>): Promise<SiaMemory>`
Update Sia's personality adjustments for the user.

```typescript
await siaMemoryService.updatePersonality(userId, {
  humor: 0.8,
  formality: 0.3,
  verbosity: 0.5
});
```

### Stats & Topics

#### `getRecentTopics(userId: string): Promise<string[]>`
Get list of recent discussion topics.

```typescript
const topics = await siaMemoryService.getRecentTopics(userId);
// ["AI development", "Project management"]
```

#### `getInteractionStats(userId: string): Promise<InteractionStats>`
Get interaction statistics.

```typescript
const stats = await siaMemoryService.getInteractionStats(userId);
console.log(stats);
// {
//   totalInteractions: 42,
//   lastInteractionAt: "2026-01-09T...",
//   factsCount: 15,
//   topicsCount: 8
// }
```

## React Hooks

### `useSiaMemory(userId: string | undefined)`
Main hook for accessing and managing Sia memory.

```tsx
import { useSiaMemory } from '@/hooks/useSiaMemory';

function SiaComponent() {
  const { memory, isLoading, updateMemory, clearMemory } = useSiaMemory(userId);

  const handleInteraction = (message: string, response: string) => {
    updateMemory({
      message,
      response,
      topic: "General conversation",
      facts: [
        {
          content: "User is active today",
          category: "context",
          confidence: 1.0
        }
      ]
    });
  };

  return (
    <div>
      <p>Total interactions: {memory?.total_interactions}</p>
      <button onClick={handleInteraction}>Send Message</button>
      <button onClick={() => clearMemory()}>Clear Memory</button>
    </div>
  );
}
```

### Other Hooks

```tsx
// Get memory summary
const { data: summary } = useSiaMemorySummary(userId);

// Get facts by category
const { data: personalFacts } = useSiaFactsByCategory(userId, 'personal');

// Get preferences
const { data: preferences } = useSiaPreferences(userId);

// Get recent topics
const { data: topics } = useSiaRecentTopics(userId);

// Get interaction stats
const { data: stats } = useSiaInteractionStats(userId);
```

## Component Usage

### SiaMemoryPanel

Display and manage Sia's memory in UI.

```tsx
import { SiaMemoryPanel } from '@/components/sia/SiaMemoryPanel';

function ProfilePage() {
  const { user } = useCurrentUser();

  return (
    <div>
      <h1>My Sia Profile</h1>
      <SiaMemoryPanel userId={user.id} />
    </div>
  );
}
```

## Integration with Sia Voice Assistant

### Basic Flow

```typescript
// 1. Load memory before conversation
const memory = await siaMemoryService.loadMemory(userId);
const memoryData = memory.memory_data as SiaMemoryData;

// 2. Use memory to provide context to Sia
const systemPrompt = `
  You are Sia, a helpful voice assistant.

  User preferences: ${JSON.stringify(memoryData.preferences)}
  Recent topics: ${memoryData.recentTopics.join(', ')}

  Use this information to personalize your responses.
`;

// 3. Process user message through Sia (ElevenLabs Agent)
const siaResponse = await elevenLabsAgent.converse(userMessage, {
  systemPrompt,
  memory: memoryData
});

// 4. Update memory after interaction
await siaMemoryService.updateMemory(userId, {
  message: userMessage,
  response: siaResponse,
  topic: extractTopic(userMessage),
  facts: extractFacts(userMessage, siaResponse),
  preferences: extractPreferences(userMessage, siaResponse)
});
```

### Advanced: Automatic Fact Extraction

```typescript
import { extractFactsFromConversation } from '@/lib/ai-utils';

async function handleSiaInteraction(userId: string, message: string, response: string) {
  // Use AI to extract facts from conversation
  const extractedFacts = await extractFactsFromConversation(message, response);

  // Update memory with extracted facts
  await siaMemoryService.updateMemory(userId, {
    message,
    response,
    topic: extractedFacts.topic,
    facts: extractedFacts.facts.map(fact => ({
      content: fact.content,
      category: fact.category,
      confidence: fact.confidence
    })),
    preferences: extractedFacts.preferences
  });
}
```

## Database Schema

The `sia_memory` table in Supabase:

```sql
CREATE TABLE public.sia_memory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  memory_data JSONB NOT NULL DEFAULT '{
    "facts": [],
    "preferences": {},
    "context": {},
    "recentTopics": []
  }'::jsonb,
  summary TEXT,
  personality_adjustments JSONB DEFAULT '{}'::jsonb,
  total_interactions INTEGER NOT NULL DEFAULT 0,
  last_interaction_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT sia_memory_user_id_unique UNIQUE (user_id)
);

-- RLS Policy: Users can only access their own memory
CREATE POLICY "sia_memory_select_own"
  ON public.sia_memory FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "sia_memory_insert_own"
  ON public.sia_memory FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "sia_memory_update_own"
  ON public.sia_memory FOR UPDATE
  USING (auth.uid() = user_id);
```

## Security Considerations

1. **RLS Enabled**: All sia_memory operations are protected by Row Level Security
2. **User Isolation**: Users can only access their own memory
3. **No Admin Override**: Even admins cannot access user memory (privacy-first)
4. **Encrypted at Rest**: Supabase handles encryption automatically
5. **Input Validation**: All inputs are validated before storage

## Performance Optimization

### Caching Strategy

```typescript
// React Query cache configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes for memory data
    },
  },
});
```

### Batch Updates

```typescript
// Instead of multiple updates, batch them:
const updates = conversations.map(conv => ({
  message: conv.message,
  response: conv.response,
  topic: conv.topic
}));

// Process in single transaction
await siaMemoryService.updateMemory(userId, {
  message: updates.map(u => u.message).join('\n'),
  response: updates.map(u => u.response).join('\n'),
  facts: extractFactsFromBatch(updates)
});
```

## Testing

```typescript
import { siaMemoryService } from '@/services/siaMemoryService';

describe('SiaMemoryService', () => {
  it('should initialize memory for new user', async () => {
    const memory = await siaMemoryService.loadMemory(newUserId);
    expect(memory.total_interactions).toBe(0);
  });

  it('should update memory after interaction', async () => {
    const updated = await siaMemoryService.updateMemory(userId, {
      message: 'Hello',
      response: 'Hi there!',
      topic: 'Greeting'
    });
    expect(updated.total_interactions).toBe(1);
  });

  it('should remove facts correctly', async () => {
    const memory = await siaMemoryService.loadMemory(userId);
    const factId = (memory.memory_data as SiaMemoryData).facts[0].id;

    await siaMemoryService.removeFact(userId, factId);

    const updated = await siaMemoryService.loadMemory(userId);
    expect((updated.memory_data as SiaMemoryData).facts).not.toContainEqual(
      expect.objectContaining({ id: factId })
    );
  });
});
```

## Future Enhancements

1. **Memory Compression**: Automatically compress old facts to save space
2. **Smart Summarization**: Use AI to generate better rolling summaries
3. **Memory Export**: Allow users to export their memory as JSON/CSV
4. **Memory Analytics**: Dashboard showing memory growth over time
5. **Fact Verification**: Confidence scoring and fact verification
6. **Memory Sharing**: Allow users to share specific memories with support
7. **Voice Patterns**: Learn user's speech patterns and vocabulary

## Related Files

- Service: `/src/services/siaMemoryService.ts`
- Hooks: `/src/hooks/useSiaMemory.ts`
- Component: `/src/components/sia/SiaMemoryPanel.tsx`
- Types: `/src/integrations/supabase/types.ts`
- Migration: `/supabase/migrations/20260108220000_oneedge_tables.sql`

## Support

For issues or questions about Sia Memory Service:
- Check the OneEdge documentation
- Review the CLAUDE.md file (lines 620-629, 737-768)
- Contact the development team
