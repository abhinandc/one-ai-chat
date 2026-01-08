# Research: OneEdge Platform Technology Decisions

**Date**: 2025-01-08
**Status**: Complete

## Executive Summary

This document captures all technology decisions and research findings for the OneEdge platform. Each decision includes rationale, alternatives considered, and alignment with constitution principles.

---

## 1. Frontend Framework

### Decision: React 18 + Vite 5 + TypeScript 5

### Rationale
- **React 18**: Concurrent features enable better UX with streaming SSR and Suspense boundaries
- **Vite 5**: Sub-second HMR, native ESM, optimal build performance
- **TypeScript 5**: Strict mode satisfies Constitution Principle I (Zero-Defect Code Quality)

### Alternatives Considered

| Alternative | Rejected Because |
|-------------|-----------------|
| Next.js | SSR overhead unnecessary for employee SPA; adds complexity |
| Remix | Newer ecosystem, fewer shadcn/ui integrations |
| Vue 3 | Team expertise in React; shadcn/ui is React-native |
| Solid.js | Smaller ecosystem, fewer enterprise-ready components |

### Constitution Alignment
- **Principle I**: TypeScript strict mode enforces type safety
- **Principle V**: Vite enables optimal bundle splitting

---

## 2. UI Component Library

### Decision: shadcn/ui + Radix Primitives

### Rationale
- **Unstyled primitives**: Full control over design without fighting framework opinions
- **Accessible by default**: WCAG 2.1 AA compliance built-in
- **Copy-paste model**: Components owned in codebase, no upgrade conflicts
- **Tailwind integration**: Seamless with existing style system

### Alternatives Considered

| Alternative | Rejected Because |
|-------------|-----------------|
| Chakra UI | Opinionated styling conflicts with OKLCH tokens |
| Material UI | Heavy bundle, Google aesthetic doesn't match Apple HIG |
| Ant Design | Enterprise-heavy, not minimalist |
| Mantine | Good but smaller ecosystem than shadcn |

### Constitution Alignment
- **Principle III**: Pixel-perfect control via unstyled primitives
- **Principle IV**: Enables Apple HIG compliance
- **Principle V**: Tree-shakeable, minimal bundle impact

---

## 3. State Management

### Decision: Zustand (Global) + TanStack Query (Server)

### Rationale
- **Zustand**: Minimal API, TypeScript-first, no boilerplate
- **TanStack Query**: Automatic caching, deduplication, background refetching
- **Separation of concerns**: UI state (Zustand) vs server state (Query)

### Alternatives Considered

| Alternative | Rejected Because |
|-------------|-----------------|
| Redux Toolkit | Boilerplate overhead for small-medium apps |
| Jotai | Atomic model adds cognitive load |
| Recoil | Facebook maintenance uncertain |
| MobX | Proxy-based reactivity harder to debug |

### Constitution Alignment
- **Principle VI**: Centralized state with clear data flow
- **Principle I**: TypeScript inference reduces errors

---

## 4. Animation Library

### Decision: Framer Motion

### Rationale
- **Declarative API**: Animations defined in component props
- **Layout animations**: Smooth resizing without manual calculations
- **Exit animations**: AnimatePresence for unmounting animations
- **Performance**: Uses GPU-accelerated transforms

### Alternatives Considered

| Alternative | Rejected Because |
|-------------|-----------------|
| React Spring | More complex API, less documentation |
| GSAP | Imperative style, licensing for commercial use |
| CSS animations only | No layout animations, harder exit handling |
| Motion One | Newer, less React integration |

### Constitution Alignment
- **Principle III**: Enables 60fps animations
- **Principle IV**: Smooth transitions for Apple-like UX

---

## 5. Testing Stack

### Decision: Vitest (Unit) + Playwright (E2E) + Testing Library

### Rationale
- **Vitest**: Vite-native, instant feedback, Jest-compatible API
- **Playwright**: Cross-browser, mobile emulation, visual comparison
- **Testing Library**: User-centric queries align with accessibility

### Alternatives Considered

| Alternative | Rejected Because |
|-------------|-----------------|
| Jest | Slower than Vitest with Vite projects |
| Cypress | Slower, no native multi-browser support |
| Puppeteer | Chrome-only, no built-in assertions |

### Constitution Alignment
- **Principle II**: Full testing pyramid coverage
- **Principle III**: Visual regression via Playwright screenshots

---

## 6. Backend & Database

### Decision: Supabase (PostgreSQL + Auth + Edge Functions)

### Rationale
- **PostgreSQL**: ACID compliance, JSON support, excellent performance
- **RLS**: Row Level Security for multi-tenant isolation
- **Auth**: Google SSO integration out of box
- **Edge Functions**: Serverless compute for sensitive operations
- **Realtime**: WebSocket subscriptions for live updates

### Alternatives Considered

| Alternative | Rejected Because |
|-------------|-----------------|
| Firebase | Vendor lock-in, Firestore query limitations |
| PlanetScale | No RLS, requires separate auth solution |
| AWS Amplify | Complex setup, higher operational overhead |
| Self-hosted PostgreSQL | Operational burden, no built-in auth |

### Constitution Alignment
- **Principle VI**: RLS enforces multi-tenant isolation
- **Principle I**: Type-safe queries via generated types
- **Principle V**: Connection pooling for scalability

---

## 7. Mobile Framework

### Decision: Flutter with Riverpod

### Rationale
- **Flutter**: Single codebase for iOS and Android
- **Performance**: Compiled to native ARM, 60fps guaranteed
- **Riverpod**: Type-safe, testable state management
- **Supabase SDK**: Native Flutter support

### Alternatives Considered

| Alternative | Rejected Because |
|-------------|-----------------|
| React Native | JavaScript bridge overhead, lower performance |
| Native (Swift/Kotlin) | Double development effort |
| Kotlin Multiplatform | iOS support still maturing |

### Constitution Alignment
- **Principle III**: Native-quality animations
- **Principle V**: 60fps performance target

---

## 8. AI Model Integration

### Decision: LiteLLM-style Proxy Pattern via EdgeAdmin

### Rationale
- **Unified interface**: Single API for all models
- **Budget control**: Virtual keys with spending limits
- **Audit trail**: All requests logged
- **Model switching**: No code changes to try new models

### Implementation
```typescript
interface AIRequest {
  model: string;           // "claude-3-opus", "gpt-4", etc.
  messages: Message[];
  virtualKey: string;      // User's allocated key
  maxTokens?: number;
  temperature?: number;
}

// Service layer abstracts model specifics
class AIService {
  async chat(request: AIRequest): Promise<AIResponse> {
    // Route through EdgeAdmin proxy
    // Proxy handles model-specific formatting
  }
}
```

### Constitution Alignment
- **Principle VI**: Service layer pattern
- **Principle I**: Type-safe request/response contracts

---

## 9. Voice AI (Sia)

### Decision: ElevenLabs Conversational AI SDK

### Rationale
- **Voice quality**: Industry-leading synthesis quality
- **Low latency**: < 500ms response time
- **Custom voices**: Branded Sia voice creation
- **Agent API**: Built-in conversation management

### Alternatives Considered

| Alternative | Rejected Because |
|-------------|-----------------|
| OpenAI TTS | Lower voice quality, no conversation API |
| Google Cloud TTS | Robotic voice quality |
| Amazon Polly | Limited voice customization |
| AssemblyAI | Focused on transcription, not synthesis |

### Implementation
```dart
// Flutter Sia Agent
class SiaAgent {
  final ElevenLabsClient _client;
  final SupabaseClient _supabase;

  Stream<AudioChunk> converse(AudioInput input) async* {
    // 1. Transcribe input
    final text = await _client.transcribe(input);

    // 2. Load memory context
    final memory = await _loadMemory();

    // 3. Generate response via AI model
    final response = await _generateResponse(text, memory);

    // 4. Synthesize voice output
    yield* _client.synthesize(response);

    // 5. Update memory
    await _updateMemory(text, response);
  }
}
```

### Constitution Alignment
- **Principle IV**: Delightful user experience
- **Principle V**: Streaming for perceived performance

---

## 10. Design System Architecture

### Decision: CSS Custom Properties with OKLCH Color Space

### Rationale
- **OKLCH**: Perceptually uniform, better for accessibility
- **Custom properties**: Runtime theme switching
- **Tailwind integration**: Utility classes reference tokens
- **Dark mode**: Single source of truth for both themes

### Token Structure
```css
/* Base tokens (semantic) */
--color-primary: oklch(0.603 0.218 257.42);
--color-background: oklch(0.971 0.003 286.35);

/* Component tokens (applied) */
--button-bg: var(--color-primary);
--card-bg: var(--color-background);

/* Spacing scale (4px base) */
--space-1: 0.25rem;  /* 4px */
--space-2: 0.5rem;   /* 8px */
--space-3: 0.75rem;  /* 12px */
--space-4: 1rem;     /* 16px */
```

### Constitution Alignment
- **Principle III**: Consistent spacing and colors
- **Principle IV**: Theme system enables dark/light modes

---

## 11. Security Architecture

### Decision: Defense in Depth

### Layers

| Layer | Implementation |
|-------|----------------|
| Input Validation | Zod schemas for all user input |
| Authentication | Supabase Auth with Google SSO |
| Authorization | RLS policies per table |
| Data Encryption | At rest (Supabase), in transit (HTTPS) |
| Credential Storage | EdgeVault with encrypted credentials |
| XSS Prevention | React's built-in escaping, CSP headers |
| CSRF Protection | Supabase Auth handles tokens |

### Constitution Alignment
- **Principle I**: Explicit error handling
- **Principle VI**: RLS for multi-tenant isolation

---

## 12. Performance Monitoring

### Decision: Lighthouse CI + Web Vitals + Custom Metrics

### Implementation
```typescript
// Custom performance tracking
const performanceMetrics = {
  // Core Web Vitals
  LCP: () => new PerformanceObserver((list) => {
    const entries = list.getEntries();
    // Report to analytics
  }),

  // Custom metrics
  timeToFirstMessage: () => {
    performance.mark('chat-loaded');
    // Measure time from navigation to first message render
  },

  // API performance
  apiLatency: (endpoint: string, duration: number) => {
    // Track p50, p95, p99
  }
};
```

### Thresholds (from Constitution)
| Metric | Target | Alert |
|--------|--------|-------|
| FCP | < 1.5s | > 2s |
| LCP | < 2.5s | > 3s |
| TTI | < 3.5s | > 4s |
| CLS | < 0.1 | > 0.15 |
| Bundle | < 500KB | > 550KB |

---

## Conclusion

All technology decisions have been made with explicit alignment to the OneEdge Constitution. Each choice prioritizes:

1. **Type safety** for zero-defect code
2. **Testability** for continuous testing
3. **Performance** for enterprise-grade UX
4. **Scalability** for future growth
5. **Accessibility** for inclusive design

No clarifications remain. The technology stack is production-ready.
