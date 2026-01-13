# Sia Memory Integration Guide

Quick start guide for integrating Sia Memory Service into your components.

## Basic Usage

### 1. Simple Memory Display

```tsx
import { useSiaMemory } from '@/hooks/useSiaMemory';

function SiaProfile() {
  const { user } = useCurrentUser();
  const { memory, isLoading } = useSiaMemory(user?.id);

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <h2>Sia Memory</h2>
      <p>Total interactions: {memory?.total_interactions || 0}</p>
    </div>
  );
}
```

### 2. Update Memory After Conversation

```tsx
import { useSiaMemory } from '@/hooks/useSiaMemory';

function SiaChat() {
  const { user } = useCurrentUser();
  const { updateMemory } = useSiaMemory(user?.id);

  const handleSendMessage = async (message: string) => {
    const response = await sendToSia(message);

    // Update memory
    updateMemory({
      message,
      response,
      topic: 'Chat',
      facts: [
        {
          content: 'User is actively chatting',
          category: 'context',
          confidence: 1.0
        }
      ]
    });
  };

  return <div>{/* Chat UI */}</div>;
}
```

### 3. Display Memory Panel

```tsx
import { SiaMemoryPanel } from '@/components/sia';

function ProfilePage() {
  const { user } = useCurrentUser();

  return (
    <div>
      <h1>Profile</h1>
      <SiaMemoryPanel userId={user.id} />
    </div>
  );
}
```

## Advanced Usage

### Custom Fact Extraction

```tsx
function extractFactsFromMessage(message: string) {
  const facts = [];

  // Example: Extract preferences
  if (message.includes('I prefer')) {
    facts.push({
      content: message,
      category: 'preference' as const,
      confidence: 0.9
    });
  }

  // Example: Extract personal info
  if (message.includes('my name is')) {
    const name = message.split('my name is')[1].trim();
    facts.push({
      content: `User's name is ${name}`,
      category: 'personal' as const,
      confidence: 1.0
    });
  }

  return facts;
}
```

### Using Memory Context in Prompts

```tsx
import { useSiaMemory } from '@/hooks/useSiaMemory';
import type { SiaMemoryData } from '@/integrations/supabase';

function buildSystemPrompt(memoryData: SiaMemoryData) {
  const facts = memoryData.facts
    .filter(f => f.confidence > 0.7)
    .map(f => f.content)
    .join('\n- ');

  const topics = memoryData.recentTopics.join(', ');

  return `
    You are Sia, a helpful voice assistant.

    Known facts about the user:
    - ${facts}

    Recent discussion topics: ${topics}

    User preferences: ${JSON.stringify(memoryData.preferences)}

    Use this information to personalize your responses.
  `;
}

function SiaWithContext() {
  const { user } = useCurrentUser();
  const { memory } = useSiaMemory(user?.id);

  const memoryData = memory?.memory_data as SiaMemoryData;

  const handleMessage = async (message: string) => {
    const systemPrompt = buildSystemPrompt(memoryData);
    const response = await sendToSia(message, { systemPrompt });
    return response;
  };

  return <div>{/* UI */}</div>;
}
```

### Mobile App Integration (Flutter)

```dart
import 'package:supabase_flutter/supabase_flutter.dart';

class SiaMemoryService {
  final SupabaseClient _supabase;

  SiaMemoryService(this._supabase);

  Future<Map<String, dynamic>> loadMemory(String userId) async {
    final response = await _supabase
        .from('sia_memory')
        .select()
        .eq('user_id', userId)
        .maybeSingle();

    if (response == null) {
      return await _initializeMemory(userId);
    }

    return response;
  }

  Future<void> updateMemory(
    String userId,
    String message,
    String response, {
    String? topic,
    List<Map<String, dynamic>>? facts,
  }) async {
    final currentMemory = await loadMemory(userId);
    final memoryData = currentMemory['memory_data'] as Map<String, dynamic>;

    // Update facts
    if (facts != null) {
      final currentFacts = List<Map<String, dynamic>>.from(
        memoryData['facts'] ?? []
      );

      for (var fact in facts) {
        currentFacts.add({
          'id': const Uuid().v4(),
          'content': fact['content'],
          'category': fact['category'],
          'confidence': fact['confidence'],
          'createdAt': DateTime.now().toIso8601String(),
          'lastReferencedAt': DateTime.now().toIso8601String(),
        });
      }

      memoryData['facts'] = currentFacts;
    }

    // Update recent topics
    if (topic != null) {
      final topics = List<String>.from(memoryData['recentTopics'] ?? []);
      topics.insert(0, topic);
      memoryData['recentTopics'] = topics.take(10).toList();
    }

    // Update context
    memoryData['context'] = {
      'lastMessage': message,
      'lastResponse': response,
      'lastInteractionAt': DateTime.now().toIso8601String(),
    };

    await _supabase.from('sia_memory').update({
      'memory_data': memoryData,
      'total_interactions': (currentMemory['total_interactions'] ?? 0) + 1,
      'last_interaction_at': DateTime.now().toIso8601String(),
    }).eq('user_id', userId);
  }
}
```

## Common Patterns

### 1. Conditional Memory Updates

Only update memory for meaningful interactions:

```tsx
const shouldUpdateMemory = (message: string, response: string) => {
  // Don't update for very short messages
  if (message.length < 5) return false;

  // Don't update for error responses
  if (response.includes('error') || response.includes('sorry')) return false;

  // Don't update for simple greetings
  if (['hi', 'hello', 'hey'].includes(message.toLowerCase())) return false;

  return true;
};

if (shouldUpdateMemory(message, response)) {
  updateMemory({ message, response });
}
```

### 2. Batch Memory Updates

For processing multiple messages:

```tsx
const batchUpdateMemory = async (interactions: Array<{message: string, response: string}>) => {
  const allFacts = [];
  const allTopics = new Set<string>();

  for (const interaction of interactions) {
    const facts = extractFactsFromMessage(interaction.message);
    allFacts.push(...facts);

    const topic = extractTopic(interaction.message);
    if (topic) allTopics.add(topic);
  }

  // Single update with all facts
  await updateMemory({
    message: interactions.map(i => i.message).join('\n'),
    response: interactions.map(i => i.response).join('\n'),
    topic: Array.from(allTopics)[0],
    facts: allFacts
  });
};
```

### 3. Memory-Based Personalization

```tsx
function PersonalizedGreeting() {
  const { user } = useCurrentUser();
  const { memory } = useSiaMemory(user?.id);

  const memoryData = memory?.memory_data as SiaMemoryData;
  const userName = memoryData?.facts.find(f =>
    f.category === 'personal' && f.content.includes('name')
  )?.content;

  return (
    <div>
      <h1>
        {userName ? `Welcome back, ${userName}!` : 'Welcome!'}
      </h1>
    </div>
  );
}
```

## Best Practices

1. **Always check loading states**
   ```tsx
   if (isLoading) return <Skeleton />;
   if (!memory) return <EmptyState />;
   ```

2. **Handle errors gracefully**
   ```tsx
   const { memory, error } = useSiaMemory(userId);
   if (error) return <ErrorMessage error={error} />;
   ```

3. **Use async mutations for critical updates**
   ```tsx
   try {
     await updateMemoryAsync(context);
   } catch (error) {
     console.error('Failed to update memory:', error);
     toast.error('Memory update failed');
   }
   ```

4. **Debounce frequent updates**
   ```tsx
   const debouncedUpdate = useDebouncedCallback(
     (context) => updateMemory(context),
     1000
   );
   ```

5. **Respect user privacy**
   ```tsx
   // Always provide a way to clear memory
   <Button onClick={() => clearMemory()}>
     Clear My Memory
   </Button>
   ```

## Testing

### Unit Test Example

```tsx
import { renderHook, waitFor } from '@testing-library/react';
import { useSiaMemory } from '@/hooks/useSiaMemory';

describe('useSiaMemory', () => {
  it('should load memory for user', async () => {
    const { result } = renderHook(() => useSiaMemory('user-id'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.memory).toBeDefined();
  });
});
```

## Troubleshooting

### Memory not updating
- Check RLS policies in Supabase
- Verify user authentication
- Check browser console for errors

### Facts not persisting
- Verify fact structure matches SiaFact type
- Check confidence score is between 0 and 1
- Ensure category is valid enum value

### Performance issues
- Reduce update frequency
- Use debouncing for rapid updates
- Check network requests in DevTools

## Resources

- Main Service: `/src/services/siaMemoryService.ts`
- React Hooks: `/src/hooks/useSiaMemory.ts`
- Components: `/src/components/sia/`
- Full Documentation: `/src/services/SIA_MEMORY_README.md`
