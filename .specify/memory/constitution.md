<!--
==============================================================================
SYNC IMPACT REPORT
==============================================================================
Version Change: N/A → 1.0.0 (Initial Constitution)
Modified Principles: N/A (New Constitution)
Added Sections:
  - Core Principles (6 principles)
  - Quality Standards
  - Testing Requirements
  - Design Standards
  - Governance
Removed Sections: N/A
Templates Status:
  - .specify/templates/plan-template.md ✅ Compatible (Constitution Check section)
  - .specify/templates/spec-template.md ✅ Compatible (User Scenarios & Testing)
  - .specify/templates/tasks-template.md ✅ Compatible (Test-first workflow)
  - .specify/templates/checklist-template.md ✅ Compatible (Flexible checklist format)
Follow-up TODOs: None
==============================================================================
-->

# OneEdge Constitution

## Core Principles

### I. Zero-Defect Code Quality

All code MUST meet production-grade standards with no tolerance for known bugs or technical debt.

**Non-Negotiable Rules:**
- Code MUST pass TypeScript strict mode (`tsc --strict`) with zero errors
- All functions MUST handle error cases explicitly; no silent failures
- Code MUST be self-documenting; complex logic requires inline comments
- No `any` types permitted except in explicitly justified edge cases
- All async operations MUST have proper error boundaries and loading states
- Memory leaks, race conditions, and unhandled promises are blocking defects
- Code reviews MUST verify edge cases, error handling, and performance implications

**Rationale:** OneEdge is an enterprise AI platform where bugs directly impact employee productivity
and organizational trust. Zero-defect discipline prevents cascading failures in production.

### II. Continuous Testing (NON-NEGOTIABLE)

Every feature MUST be validated through a comprehensive testing pyramid before deployment.

**Testing Pyramid Requirements:**
- **Unit Tests (70%)**: All business logic, utilities, and hooks MUST have unit tests
- **Integration Tests (20%)**: All API interactions, state management, and data flows MUST be tested
- **E2E Tests (10%)**: Critical user journeys MUST have Playwright E2E coverage

**Test Categories (ALL MANDATORY for features):**
- **UI Tests**: Component rendering, interactions, accessibility (a11y), responsive behavior
- **Functional Tests**: Business logic correctness, state transitions, data transformations
- **Integration Tests**: API contracts, Supabase queries, cross-component communication
- **Security Tests**: Input validation, XSS prevention, authentication flows, RLS policy verification

**Process:**
- Tests MUST be written BEFORE implementation (TDD red-green-refactor)
- Tests MUST fail initially to prove they are testing the right behavior
- No PR merges with failing tests or coverage regression
- Minimum 80% code coverage for new features; 70% for overall codebase

**Rationale:** Enterprise AI platforms require bulletproof reliability. Comprehensive testing catches
defects before they reach production where they impact thousands of employees.

### III. Pixel-Perfect UI Execution

All user interfaces MUST achieve exact visual fidelity to designs with zero deviation.

**Non-Negotiable Rules:**
- Spacing MUST use the 4px/8px grid system consistently (4, 8, 12, 16, 24, 32, 48, 64)
- Typography MUST follow the type scale exactly; no arbitrary font sizes
- Colors MUST use CSS custom properties (OKLCH color space) from design tokens only
- Icons MUST maintain consistent sizing (16, 20, 24px) and stroke weights
- Animations MUST be smooth (60fps), purposeful, and use consistent easing curves
- All interactive elements MUST have visible focus states for accessibility
- Responsive breakpoints MUST be tested: 320px, 375px, 768px, 1024px, 1280px, 1440px

**Visual QA Process:**
- Screenshot comparison testing for UI components
- Manual visual review at all breakpoints before merge
- Dark mode and light mode MUST be visually verified

**Rationale:** Pixel-perfect execution builds user trust and reflects the premium quality expected
of enterprise software serving professional users daily.

### IV. Apple Design System & Avant-Garde UI

User interfaces MUST embody Apple Human Interface Guidelines while pushing creative boundaries.

**Design Philosophy:**
- **Clarity**: Content is the priority; UI elements support rather than compete
- **Deference**: Fluid motion and subtle depth help users understand hierarchy
- **Depth**: Visual layers and realistic motion convey interaction and context

**Apple HIG Principles (MANDATORY):**
- Navigation MUST be intuitive; users should always know where they are and how to go back
- Touch targets MUST be minimum 44x44pt for interactive elements
- Feedback MUST be immediate; every action needs a visible response
- Typography MUST prioritize legibility with proper contrast ratios (4.5:1 minimum, 7:1 for text)
- Negative space MUST be used generously to reduce cognitive load
- Gestures (where applicable) MUST follow platform conventions

**Avant-Garde Elements:**
- Micro-interactions MUST delight without distracting (subtle hover states, smooth transitions)
- Progressive disclosure MUST reveal complexity only when needed
- Empty states MUST be designed thoughtfully with clear next actions
- Loading states MUST be elegant (skeleton screens preferred over spinners)
- Error states MUST be helpful, not alarming (clear guidance, recovery actions)

**Component Standards:**
- Use shadcn/ui components as the foundation; extend, don't replace
- Custom components MUST match shadcn/ui quality and accessibility standards
- Animations MUST use Framer Motion or CSS transitions; no janky JS animations

**Rationale:** Users spend hours in OneEdge daily. Apple-inspired design with modern flourishes
creates an experience that feels premium, reduces friction, and inspires confidence.

### V. High Performance (NON-NEGOTIABLE)

All features MUST meet strict performance budgets to ensure a responsive user experience.

**Performance Budgets:**
- **First Contentful Paint (FCP)**: < 1.5s on 3G networks
- **Largest Contentful Paint (LCP)**: < 2.5s
- **Time to Interactive (TTI)**: < 3.5s
- **Cumulative Layout Shift (CLS)**: < 0.1
- **First Input Delay (FID)**: < 100ms
- **Bundle Size**: < 500KB gzipped for initial load
- **API Response Time**: < 200ms p95 for user-facing endpoints

**Optimization Requirements:**
- Route-based code splitting MUST be implemented for all pages
- Images MUST be lazy-loaded and properly sized (srcset, WebP/AVIF)
- Lists > 50 items MUST use virtualization (react-virtual or similar)
- Heavy computations MUST be memoized or moved to web workers
- Database queries MUST be optimized with proper indexes and pagination
- React renders MUST be optimized (memo, useMemo, useCallback where appropriate)

**Monitoring:**
- Core Web Vitals MUST be tracked in production
- Performance regression tests MUST run in CI pipeline
- Bundle size changes MUST be reviewed in PRs

**Rationale:** Enterprise users expect desktop-class performance. Slow AI interfaces frustrate users
and reduce adoption. Performance is a feature, not an afterthought.

### VI. Scalability Architecture

All implementations MUST be designed for horizontal scaling and future growth.

**Architectural Requirements:**
- State management MUST be centralized (Zustand stores) with clear data flow
- Components MUST be loosely coupled and independently testable
- API calls MUST go through a service layer; no direct fetch in components
- Database queries MUST use connection pooling and prepared statements
- Real-time features MUST use Supabase subscriptions with proper cleanup
- Caching strategies MUST be implemented for frequently accessed data

**Scalability Targets:**
- Support 10,000+ concurrent users without degradation
- Handle 1M+ stored conversations without performance impact
- Process 100+ API requests/second per user session
- Maintain < 200ms response times under load

**Future-Proofing:**
- Feature flags MUST be used for gradual rollouts
- Database schema changes MUST be backward compatible
- API versioning MUST be planned for breaking changes
- Multi-tenant isolation MUST be enforced via RLS policies

**Rationale:** OneEdge serves enterprise teams that will grow. Architecture decisions made today
MUST not become bottlenecks tomorrow.

## Quality Standards

### Code Review Checklist

All PRs MUST pass these gates:

- [ ] TypeScript strict mode passes with zero errors
- [ ] No new `any` types without explicit justification comment
- [ ] All error cases handled with appropriate user feedback
- [ ] Unit tests written and passing (80%+ coverage for new code)
- [ ] Integration tests for API interactions
- [ ] E2E tests for critical user paths
- [ ] Security considerations addressed (input validation, XSS prevention)
- [ ] Performance impact assessed (bundle size, render optimization)
- [ ] Accessibility verified (keyboard navigation, screen reader, contrast)
- [ ] Visual review completed at all breakpoints
- [ ] Dark mode and light mode verified
- [ ] Documentation updated if API changed

### Security Requirements

- All user inputs MUST be validated with Zod schemas
- All database queries MUST use parameterized statements (Supabase handles this)
- All sensitive data MUST be encrypted at rest and in transit
- All authentication flows MUST follow OWASP guidelines
- RLS policies MUST be verified with test cases
- No secrets in code; all credentials via environment variables
- Dependencies MUST be audited for vulnerabilities regularly

## Testing Requirements

### Test Structure

```
tests/
├── unit/           # Pure function and hook tests
├── integration/    # API and state management tests
├── e2e/            # Playwright end-to-end tests
├── visual/         # Screenshot comparison tests
└── security/       # Security-specific test cases
```

### Test Naming Convention

- Unit: `[function/hook].test.ts`
- Integration: `[feature].integration.test.ts`
- E2E: `[user-journey].e2e.ts`
- Visual: `[component].visual.test.ts`

### Coverage Enforcement

- New features: 80% minimum coverage
- Bug fixes: Add regression test before fix
- Refactors: Maintain existing coverage level

## Design Standards

### Color Tokens (OKLCH)

All colors MUST use CSS custom properties defined in the design system. Raw hex/rgb values are
prohibited in component code.

### Spacing Scale (4px base)

```
--spacing-1: 4px
--spacing-2: 8px
--spacing-3: 12px
--spacing-4: 16px
--spacing-6: 24px
--spacing-8: 32px
--spacing-12: 48px
--spacing-16: 64px
```

### Typography Scale

Use shadcn/ui typography classes. Custom font sizes require design system approval.

### Animation Standards

- Micro-interactions: 150-200ms, ease-out
- Page transitions: 200-300ms, ease-in-out
- Modal/drawer: 200ms, ease-out
- Loading states: Skeleton screens preferred

## Governance

### Amendment Process

1. Propose changes via PR to constitution.md
2. Document rationale for each change
3. Require approval from tech lead
4. Update version according to semantic rules
5. Propagate changes to all dependent templates

### Compliance

- All PRs MUST include constitution compliance verification
- Code reviews MUST check principle adherence
- Violations MUST be justified with documented rationale
- Regular audits MUST verify ongoing compliance

### Exceptions

Exceptions to principles require:
1. Written justification in PR description
2. Tech lead approval
3. Documented plan to return to compliance (if temporary)

**Version**: 1.0.0 | **Ratified**: 2025-01-08 | **Last Amended**: 2025-01-08
