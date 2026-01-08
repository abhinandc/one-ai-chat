# Implementation Plan: OneEdge Platform

**Branch**: `feature/001-oneedge-platform` | **Date**: 2025-01-08 | **Spec**: [CLAUDE.md](/CLAUDE.md)
**Input**: Product Requirements Document from `CLAUDE.md`

## Summary

OneEdge is an employee-facing AI platform providing enterprise teams with controlled access to multiple AI models. This implementation plan covers the complete platform buildout including web application (React/Vite), mobile applications (Flutter), and all backend services (Supabase). The plan is structured for parallel development with continuous testing gates aligned with the constitution principles.

## Technical Context

**Language/Version**: TypeScript 5.x (Web), Dart 3.x (Mobile)
**Primary Dependencies**: React 18, Vite 5, shadcn/ui, TanStack Query, Zustand (Web) | Flutter 3.x, Riverpod, Supabase SDK (Mobile)
**Storage**: Supabase PostgreSQL with RLS policies
**Testing**: Vitest + Playwright (Web), flutter_test (Mobile)
**Target Platform**: Web (all modern browsers), iOS 15+, Android 10+
**Project Type**: Web + Mobile (parallel development tracks)
**Performance Goals**: FCP < 1.5s, LCP < 2.5s, TTI < 3.5s, CLS < 0.1, 60fps animations
**Constraints**: Bundle < 500KB gzipped, API p95 < 200ms, 10K+ concurrent users
**Scale/Scope**: 10,000+ concurrent users, 1M+ stored conversations, 9 web pages, 6 mobile screens

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle I: Zero-Defect Code Quality
| Gate | Status | Evidence |
|------|--------|----------|
| TypeScript strict mode | PASS | `tsconfig.json` with `strict: true` |
| No `any` types | PASS | ESLint rule `@typescript-eslint/no-explicit-any` |
| Explicit error handling | PASS | Zod schemas for all inputs, error boundaries |
| Self-documenting code | PASS | JSDoc for public APIs, inline comments for complex logic |

### Principle II: Continuous Testing (NON-NEGOTIABLE)
| Gate | Status | Evidence |
|------|--------|----------|
| Unit Tests (70%) | PASS | Vitest for utilities, hooks, services |
| Integration Tests (20%) | PASS | Supabase query tests, state management tests |
| E2E Tests (10%) | PASS | Playwright for critical user journeys |
| TDD Process | PASS | Tests written before implementation |
| 80% Coverage | PASS | Coverage gates in CI pipeline |

### Principle III: Pixel-Perfect UI Execution
| Gate | Status | Evidence |
|------|--------|----------|
| 4px/8px grid | PASS | Tailwind spacing scale configured |
| OKLCH color tokens | PASS | CSS custom properties in design system |
| 60fps animations | PASS | Framer Motion with performance monitoring |
| Responsive breakpoints | PASS | 320px, 375px, 768px, 1024px, 1280px, 1440px |
| Visual QA | PASS | Screenshot comparison in CI |

### Principle IV: Apple Design System & Avant-Garde UI
| Gate | Status | Evidence |
|------|--------|----------|
| Apple HIG compliance | PASS | 44x44pt touch targets, immediate feedback |
| shadcn/ui foundation | PASS | All components extend shadcn/ui |
| Skeleton loaders | PASS | No spinners for loading states |
| Progressive disclosure | PASS | Complexity revealed only when needed |

### Principle V: High Performance (NON-NEGOTIABLE)
| Gate | Status | Evidence |
|------|--------|----------|
| FCP < 1.5s | PASS | Route-based code splitting |
| Bundle < 500KB | PASS | Tree shaking, lazy loading |
| API p95 < 200ms | PASS | Optimized Supabase queries with indexes |
| React optimization | PASS | memo, useMemo, useCallback where appropriate |

### Principle VI: Scalability Architecture
| Gate | Status | Evidence |
|------|--------|----------|
| Centralized state | PASS | Zustand stores with clear data flow |
| Service layer | PASS | No direct fetch in components |
| RLS policies | PASS | All tables have RLS enabled |
| Feature flags | PASS | Gradual rollout capability |

## Project Structure

### Documentation (this feature)

```text
specs/001-oneedge-platform/
├── plan.md              # This file
├── research.md          # Phase 0 output - technology decisions
├── data-model.md        # Phase 1 output - entity definitions
├── quickstart.md        # Phase 1 output - local development setup
├── contracts/           # Phase 1 output - API specifications
│   ├── chat-api.yaml
│   ├── auth-api.yaml
│   ├── models-api.yaml
│   ├── automations-api.yaml
│   └── agents-api.yaml
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
# Web Application (React/Vite)
src/
├── components/
│   ├── ui/              # shadcn/ui components
│   ├── shell/           # Layout: Sidebar, Header, Footer
│   ├── chat/            # Chat: MessageList, MessageInput, ModelSelector
│   ├── dashboard/       # Dashboard: Spotlight, MetricsCard, QuickActions
│   ├── agents/          # Agents: NodeEditor, AgentCanvas, N8NConfig
│   ├── automations/     # Automations: TemplateCard, CredentialManager
│   ├── prompts/         # Prompts: PromptCard, PlaygroundPanel
│   ├── models/          # Models: ModelCard, UsageChart
│   └── modals/          # Modals: ShareModal, ConfirmDialog
├── pages/
│   ├── Dashboard.tsx
│   ├── Chat.tsx
│   ├── Agents.tsx
│   ├── Automations.tsx
│   ├── ModelsHub.tsx
│   ├── PromptLibrary.tsx
│   ├── AIGallery.tsx
│   ├── Help.tsx
│   └── AdminSettings.tsx
├── hooks/
│   ├── useAuth.ts
│   ├── useChat.ts
│   ├── useModels.ts
│   ├── useAutomations.ts
│   └── usePrompts.ts
├── services/
│   ├── supabaseClient.ts
│   ├── chatService.ts
│   ├── modelService.ts
│   ├── automationService.ts
│   └── promptService.ts
├── stores/
│   ├── authStore.ts
│   ├── chatStore.ts
│   ├── uiStore.ts
│   └── preferencesStore.ts
├── types/
│   ├── api.ts
│   ├── models.ts
│   └── database.ts
├── lib/
│   ├── utils.ts
│   ├── validators.ts
│   └── constants.ts
└── styles/
    ├── globals.css
    └── tokens.css

tests/
├── unit/
│   ├── hooks/
│   ├── services/
│   └── lib/
├── integration/
│   ├── chat.integration.test.ts
│   ├── auth.integration.test.ts
│   └── models.integration.test.ts
├── e2e/
│   ├── chat.e2e.ts
│   ├── dashboard.e2e.ts
│   └── auth.e2e.ts
├── visual/
│   ├── components/
│   └── pages/
└── security/
    ├── xss.test.ts
    └── rls.test.ts

# Mobile Application (Flutter)
mobile/
├── lib/
│   ├── core/
│   │   ├── theme/
│   │   ├── routing/
│   │   └── di/
│   ├── features/
│   │   ├── auth/
│   │   ├── chat/
│   │   ├── sia/
│   │   └── projects/
│   ├── shared/
│   │   ├── widgets/
│   │   └── services/
│   └── main.dart
└── test/
    ├── unit/
    ├── widget/
    └── integration/

# Supabase
supabase/
├── migrations/
│   ├── 001_initial_schema.sql
│   ├── 002_agents_tables.sql
│   ├── 003_automation_tables.sql
│   └── 004_mobile_tables.sql
└── functions/
    ├── encrypt-credential/
    ├── sync-n8n/
    └── process-automation/
```

**Structure Decision**: Web + Mobile parallel development tracks with shared Supabase backend. Web is the primary focus (Phase 1-2), Mobile follows (Phase 3-4).

## Parallel Development Strategy

### Development Tracks

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       PARALLEL DEVELOPMENT TRACKS                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  TRACK A: Infrastructure & Backend (Week 1-2)                               │
│  ├── Supabase schema migrations                                              │
│  ├── RLS policies implementation                                             │
│  ├── Edge Functions                                                          │
│  └── Auth flow (Google SSO)                                                  │
│                                                                              │
│  TRACK B: Design System & Components (Week 1-2) [Parallel with A]           │
│  ├── OKLCH theme implementation                                              │
│  ├── shadcn/ui component setup                                               │
│  ├── Animation primitives (Framer Motion)                                    │
│  └── Responsive layout system                                                │
│                                                                              │
│  TRACK C: Core Features - Web (Week 3-6) [After A & B]                      │
│  ├── C1: Dashboard (Spotlight, Metrics) - 1 dev                             │
│  ├── C2: Chat (Messages, Models) - 1 dev [Parallel with C1]                 │
│  ├── C3: Prompt Library + Playground - 1 dev [Parallel with C1, C2]         │
│  └── C4: Models Hub - 1 dev [Parallel with C1, C2, C3]                      │
│                                                                              │
│  TRACK D: Enterprise Features - Web (Week 5-8) [Overlaps with C]            │
│  ├── D1: Automations + EdgeVault - 1 dev                                    │
│  ├── D2: Agents + n8n Integration - 1 dev [Parallel with D1]                │
│  ├── D3: AI Gallery - 1 dev [Parallel with D1, D2]                          │
│  └── D4: Admin Settings - 1 dev [After D1-D3 dependencies]                  │
│                                                                              │
│  TRACK E: Mobile MVP (Week 7-10) [Overlaps with D]                          │
│  ├── E1: Flutter setup + Auth - 1 dev                                       │
│  ├── E2: Chat interface - 1 dev [After E1]                                  │
│  ├── E3: Projects + Sia - 1 dev [After E2]                                  │
│  └── E4: Polish + Distribution - 1 dev [After E3]                           │
│                                                                              │
│  TRACK F: Testing & QA (Continuous) [Throughout all tracks]                 │
│  ├── Unit tests (written with each feature)                                  │
│  ├── Integration tests (after feature completion)                            │
│  ├── E2E tests (after integration tests)                                     │
│  ├── Visual regression tests (after E2E)                                     │
│  └── Security tests (after visual)                                           │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Testing Waterfall (Per Feature)

```
Feature Development Flow:

┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   WRITE      │    │   WRITE      │    │  IMPLEMENT   │    │   VERIFY     │
│   TESTS      │───►│   TESTS      │───►│   FEATURE    │───►│   TESTS      │
│   (fail)     │    │   (fail)     │    │   CODE       │    │   (pass)     │
└──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
       │                   │                   │                    │
       ▼                   ▼                   ▼                    ▼
   Unit Tests        Integration         Component           All Tests
   (70%)             Tests (20%)         Code                 Green

                     Constitution Gates Applied:
                     ├── TypeScript strict
                     ├── No any types
                     ├── Error boundaries
                     ├── Loading states
                     └── Accessibility
```

### Continuous Testing Pipeline

```yaml
# .github/workflows/ci.yml concept
on: [push, pull_request]

jobs:
  # GATE 1: Static Analysis (< 2 min)
  lint-typecheck:
    - TypeScript strict mode
    - ESLint (no-any, error handling)
    - Prettier formatting

  # GATE 2: Unit Tests (< 5 min) [Parallel with GATE 1]
  unit-tests:
    - Vitest with 80% coverage gate
    - Hooks, services, utilities

  # GATE 3: Integration Tests (< 10 min) [After GATE 1 & 2]
  integration-tests:
    - Supabase queries
    - State management
    - API contracts

  # GATE 4: E2E Tests (< 15 min) [After GATE 3]
  e2e-tests:
    - Playwright critical paths
    - Auth flow
    - Chat flow
    - Dashboard flow

  # GATE 5: Visual Regression (< 10 min) [Parallel with GATE 4]
  visual-tests:
    - Screenshot comparisons
    - All breakpoints
    - Dark/light mode

  # GATE 6: Performance (< 5 min) [After GATE 4 & 5]
  performance:
    - Lighthouse CI
    - Bundle size check
    - Core Web Vitals

  # GATE 7: Security (< 5 min) [Parallel with GATE 6]
  security:
    - Dependency audit
    - XSS tests
    - RLS policy tests
```

## Phase Breakdown

### Phase 1: Core Polish (Web) - Weeks 1-4

**Goal**: Establish foundation and polish existing features

| Week | Track A (Backend) | Track B (Design) | Track C (Features) |
|------|------------------|------------------|-------------------|
| 1 | Schema migrations, RLS | OKLCH theme, tokens | - |
| 2 | Auth flow, Edge Functions | shadcn/ui setup | - |
| 3 | - | Animation system | Dashboard, Chat |
| 4 | - | Responsive layouts | Prompt Library, Models |

**Deliverables**:
- [ ] Supabase schema with all new tables
- [ ] Complete RLS policies with tests
- [ ] Google SSO via Supabase Auth
- [ ] OKLCH design tokens implemented
- [ ] shadcn/ui components styled
- [ ] Dashboard with Spotlight search
- [ ] Chat with model selector
- [ ] Prompt Library with Playground merged
- [ ] Models Hub with usage charts

### Phase 2: Enterprise Features (Web) - Weeks 5-8

**Goal**: Add enterprise-grade features

| Week | Track D (Enterprise) | Track F (Testing) |
|------|---------------------|-------------------|
| 5 | Automations, EdgeVault | Integration tests Phase 1 |
| 6 | Agents, n8n integration | E2E tests Phase 1 |
| 7 | AI Gallery | Integration tests Phase 2 |
| 8 | Admin Settings | E2E tests Phase 2 |

**Deliverables**:
- [ ] EdgeVault credential management
- [ ] Automation templates (GSuite, Slack, Jira)
- [ ] Agent builder with ReactFlow
- [ ] n8n configuration and sync
- [ ] AI Gallery (model/tool requests)
- [ ] Admin settings page
- [ ] Full test coverage (80%+)

### Phase 3: Mobile MVP - Weeks 7-10

**Goal**: Launch mobile app with core features

| Week | Track E (Mobile) |
|------|-----------------|
| 7 | Flutter setup, Auth |
| 8 | Chat interface |
| 9 | Projects, Sia basic |
| 10 | Polish, TestFlight |

**Deliverables**:
- [ ] Flutter project with shared Supabase
- [ ] Google SSO authentication
- [ ] Chat with model modes
- [ ] Projects organization
- [ ] Basic Sia voice integration
- [ ] TestFlight/Managed Play release

### Phase 4: Mobile Polish - Weeks 11-12

**Goal**: Full-featured mobile experience

**Deliverables**:
- [ ] Full Sia voice implementation
- [ ] Mode presets (Thinking, Fast, Coding)
- [ ] Offline caching
- [ ] Push notifications
- [ ] App Store/Play Store submission

## Complexity Tracking

> **No violations identified. All architecture decisions align with constitution.**

| Decision | Constitution Alignment |
|----------|----------------------|
| Zustand for state | Principle VI: Centralized state |
| shadcn/ui components | Principle IV: Component standards |
| Vitest + Playwright | Principle II: Testing pyramid |
| Route-based splitting | Principle V: Performance budgets |
| Service layer pattern | Principle VI: Loose coupling |

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Integration complexity | Feature flags for gradual rollout |
| Performance regression | CI pipeline with Lighthouse gates |
| Mobile parity | Shared Supabase ensures data consistency |
| n8n integration issues | Comprehensive contract tests |
| ElevenLabs latency | Local caching, graceful degradation |

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Test Coverage | 80%+ new, 70%+ overall | Vitest coverage report |
| Bundle Size | < 500KB | Vite build analysis |
| FCP | < 1.5s | Lighthouse CI |
| LCP | < 2.5s | Lighthouse CI |
| E2E Pass Rate | 100% | Playwright reports |
| Visual Regression | 0 unintended changes | Percy/Chromatic |

---

**Next Steps**:
1. Run `/speckit.tasks` to generate detailed task list
2. Create feature branches per track
3. Set up CI pipeline with all gates
4. Begin Track A & B in parallel
