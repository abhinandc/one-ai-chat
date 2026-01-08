# Quickstart: OneEdge Platform Development

**Date**: 2025-01-08
**Status**: Complete

## Prerequisites

Before starting, ensure you have:

- **Node.js**: v20.x or higher (LTS recommended)
- **pnpm**: v8.x or higher (`npm install -g pnpm`)
- **Git**: v2.x or higher
- **VS Code**: With recommended extensions (see below)
- **Supabase CLI**: (`npm install -g supabase`)
- **Flutter** (for mobile): v3.x stable

### Recommended VS Code Extensions

```json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "ms-vscode.vscode-typescript-next",
    "prisma.prisma",
    "ms-playwright.playwright",
    "vitest.explorer",
    "dart-code.flutter"
  ]
}
```

---

## Environment Setup

### 1. Clone Repository

```bash
git clone <repository-url>
cd one-ai-chat
```

### 2. Install Dependencies

```bash
# Install all dependencies
pnpm install

# Verify installation
pnpm typecheck
```

### 3. Environment Variables

Create `.env.local` from template:

```bash
cp .env.example .env.local
```

Configure required variables:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# API Proxy (for AI models)
VITE_API_PROXY_URL=https://your-proxy.example.com

# ElevenLabs (optional, for Sia voice)
VITE_ELEVENLABS_API_KEY=your-key

# Development
VITE_ENV=development
```

### 4. Supabase Setup

```bash
# Login to Supabase
supabase login

# Link to project
supabase link --project-ref <project-id>

# Run migrations
supabase db push

# Generate TypeScript types
supabase gen types typescript --linked > src/types/database.ts
```

---

## Development Workflow

### Start Development Server

```bash
# Start Vite dev server
pnpm dev

# Server runs at http://localhost:5173
```

### Type Checking

```bash
# Run TypeScript check
pnpm typecheck

# Watch mode
pnpm typecheck:watch
```

### Linting & Formatting

```bash
# Run ESLint
pnpm lint

# Fix auto-fixable issues
pnpm lint:fix

# Format with Prettier
pnpm format
```

---

## Testing

### Unit Tests (Vitest)

```bash
# Run all unit tests
pnpm test

# Watch mode
pnpm test:watch

# With coverage
pnpm test:coverage

# Run specific file
pnpm test src/hooks/useChat.test.ts
```

### Integration Tests

```bash
# Run integration tests
pnpm test:integration

# With Supabase local
pnpm test:integration:local
```

### E2E Tests (Playwright)

```bash
# Install browsers (first time)
pnpm exec playwright install

# Run E2E tests
pnpm test:e2e

# With UI mode (visual debugging)
pnpm test:e2e:ui

# Run specific test
pnpm test:e2e tests/e2e/chat.e2e.ts

# Generate test report
pnpm test:e2e:report
```

### Visual Regression Tests

```bash
# Update screenshots
pnpm test:visual:update

# Run visual comparison
pnpm test:visual
```

### Security Tests

```bash
# Run security tests
pnpm test:security
```

### Full Test Suite (CI)

```bash
# Run all tests (same as CI)
pnpm ci
```

---

## Building

### Production Build

```bash
# Build for production
pnpm build

# Preview production build
pnpm preview
```

### Bundle Analysis

```bash
# Analyze bundle size
pnpm build:analyze
```

---

## Mobile Development

### Flutter Setup

```bash
cd mobile

# Get dependencies
flutter pub get

# Run on connected device
flutter run

# Run on iOS simulator
flutter run -d ios

# Run on Android emulator
flutter run -d android
```

### Mobile Testing

```bash
cd mobile

# Unit tests
flutter test

# Integration tests
flutter test integration_test/
```

---

## Database Operations

### Migrations

```bash
# Create new migration
supabase migration new <migration-name>

# Apply migrations
supabase db push

# Reset database (caution!)
supabase db reset
```

### Seed Data

```bash
# Run seed script
pnpm db:seed

# Reset and seed
supabase db reset && pnpm db:seed
```

### Type Generation

```bash
# Regenerate database types
pnpm db:types
```

---

## Project Structure Reference

```
.
├── src/
│   ├── components/          # React components
│   │   ├── ui/             # shadcn/ui base components
│   │   ├── shell/          # Layout components
│   │   ├── chat/           # Chat feature components
│   │   ├── dashboard/      # Dashboard components
│   │   └── ...
│   ├── pages/              # Route components
│   ├── hooks/              # Custom React hooks
│   ├── services/           # API service layer
│   ├── stores/             # Zustand state stores
│   ├── types/              # TypeScript types
│   ├── lib/                # Utilities
│   └── styles/             # Global styles
├── tests/
│   ├── unit/               # Unit tests
│   ├── integration/        # Integration tests
│   ├── e2e/                # Playwright E2E tests
│   ├── visual/             # Visual regression tests
│   └── security/           # Security tests
├── mobile/                 # Flutter mobile app
├── supabase/
│   ├── migrations/         # Database migrations
│   └── functions/          # Edge Functions
└── specs/                  # Feature specifications
```

---

## Common Tasks

### Add a New Page

1. Create page component in `src/pages/`
2. Add route in `src/App.tsx`
3. Create corresponding tests
4. Update navigation if needed

### Add a New Component

1. Create component in appropriate `src/components/` subdirectory
2. Add unit tests in `tests/unit/`
3. Add visual tests if UI component
4. Export from index file

### Add a shadcn/ui Component

```bash
# Add component
pnpm dlx shadcn@latest add button

# Component added to src/components/ui/
```

### Add a New Service

1. Create service in `src/services/`
2. Add TypeScript types
3. Add integration tests
4. Export from services index

### Add a Supabase Table

1. Create migration: `supabase migration new <name>`
2. Write SQL in migration file
3. Apply: `supabase db push`
4. Regenerate types: `pnpm db:types`
5. Create service methods
6. Write RLS policy tests

---

## Debugging

### React DevTools

Install browser extension for React component inspection.

### Network Debugging

Supabase requests visible in Network tab. Look for `/rest/v1/` endpoints.

### State Debugging

```typescript
// In development, Zustand stores are in window.__STORES__
console.log(window.__STORES__.authStore.getState());
```

### E2E Test Debugging

```bash
# Run with headed browser
pnpm test:e2e -- --headed

# Run with debug mode
pnpm test:e2e -- --debug

# Generate trace
pnpm test:e2e -- --trace on
```

---

## Troubleshooting

### "Module not found"

```bash
# Clear node_modules and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### "TypeScript errors"

```bash
# Regenerate types
pnpm db:types
pnpm typecheck
```

### "Tests failing"

```bash
# Reset test database
supabase db reset

# Clear test cache
pnpm test -- --clearCache
```

### "E2E tests flaky"

```bash
# Increase timeout
pnpm test:e2e -- --timeout 60000

# Run in serial
pnpm test:e2e -- --workers 1
```

### "Build failing"

```bash
# Check for TypeScript errors
pnpm typecheck

# Check bundle size
pnpm build:analyze
```

---

## CI/CD Pipeline

The CI pipeline runs on every PR and push to main:

1. **Lint & Type Check** (< 2 min)
2. **Unit Tests** (< 5 min)
3. **Integration Tests** (< 10 min)
4. **E2E Tests** (< 15 min)
5. **Visual Regression** (< 10 min)
6. **Performance Audit** (< 5 min)
7. **Security Scan** (< 5 min)

All gates must pass before merge.

---

## Getting Help

- **Documentation**: Check `specs/` directory for feature specs
- **Constitution**: See `.specify/memory/constitution.md` for coding standards
- **CLAUDE.md**: Product requirements and architecture overview

---

## Quick Commands Reference

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start dev server |
| `pnpm build` | Production build |
| `pnpm test` | Run unit tests |
| `pnpm test:e2e` | Run E2E tests |
| `pnpm typecheck` | TypeScript check |
| `pnpm lint` | Run ESLint |
| `pnpm format` | Format with Prettier |
| `pnpm db:types` | Regenerate DB types |
| `pnpm ci` | Full CI pipeline |
