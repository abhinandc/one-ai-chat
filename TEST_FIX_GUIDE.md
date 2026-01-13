# OneEdge Test Fix Guide
**Priority-Ordered Action Items**

---

## 🔴 CRITICAL FIX #1: Supabase Mock (2 hours)
**Impact**: Unblocks 16 integration tests + enables E2E auth

### Current Problem
```typescript
// tests/__mocks__/supabase.ts - BROKEN
export const mockSupabase = {
  auth: {
    onAuthStateChange: vi.fn() // Returns undefined
  }
};
```

### Fix Required
```typescript
// tests/__mocks__/supabase.ts - FIXED
import { vi } from 'vitest';

export const mockSupabase = {
  auth: {
    // Fix: Return proper structure with data.subscription
    onAuthStateChange: vi.fn((callback) => {
      // Optionally call callback immediately for testing
      // callback('SIGNED_IN', mockSession);

      return {
        data: {
          subscription: {
            unsubscribe: vi.fn()
          }
        }
      };
    }),

    getSession: vi.fn(async () => ({
      data: { session: null },
      error: null
    })),

    getUser: vi.fn(async () => ({
      data: { user: null },
      error: null
    })),

    signInWithOAuth: vi.fn(async () => ({
      data: { provider: 'google', url: 'https://mock-oauth.com' },
      error: null
    })),

    signOut: vi.fn(async () => ({
      error: null
    }))
  },

  from: vi.fn((table) => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(async () => ({
          data: null,
          error: null,
          status: 200,
          statusText: 'OK'
        }))
      }))
    })),
    insert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(async () => ({
          data: null,
          error: null
        }))
      }))
    })),
    update: vi.fn(() => ({
      eq: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(async () => ({
            data: null,
            error: null
          }))
        }))
      }))
    })),
    delete: vi.fn(() => ({
      eq: vi.fn(async () => ({
        error: null
      }))
    }))
  }))
};
```

### Test After Fix
```bash
pnpm test:integration
# Expected: 17/17 passing (currently 1/17)
```

---

## 🔴 CRITICAL FIX #2: E2E Auth Setup (2 hours)
**Impact**: Unblocks 60 E2E tests

### Current Problem
```typescript
// tests/e2e/auth.setup.ts - NOT PERSISTING SESSION
test('authenticate', async ({ page }) => {
  // Mock auth but not storing properly in .auth/user.json
});
```

### Fix Required
```typescript
// tests/e2e/auth.setup.ts - FIXED
import { test as setup, expect } from '@playwright/test';
import path from 'path';

const authFile = path.join(__dirname, '../../.auth/user.json');

setup('authenticate', async ({ page, context }) => {
  // Navigate to login page
  await page.goto('/');

  // Mock the authentication by setting localStorage directly
  // This simulates what happens after successful OAuth
  await context.addCookies([{
    name: 'sb-access-token',
    value: 'mock-access-token-for-e2e-tests',
    domain: 'localhost',
    path: '/',
    httpOnly: false,
    secure: false,
    sameSite: 'Lax'
  }, {
    name: 'sb-refresh-token',
    value: 'mock-refresh-token-for-e2e-tests',
    domain: 'localhost',
    path: '/',
    httpOnly: false,
    secure: false,
    sameSite: 'Lax'
  }]);

  // Set localStorage with user data
  await page.evaluate(() => {
    const mockUser = {
      id: 'test-user-id-123',
      email: 'test@example.com',
      user_metadata: {
        full_name: 'Test User',
        avatar_url: 'https://example.com/avatar.png'
      }
    };

    localStorage.setItem('sb-oneedge-auth-token', JSON.stringify({
      access_token: 'mock-access-token-for-e2e-tests',
      refresh_token: 'mock-refresh-token-for-e2e-tests',
      user: mockUser
    }));

    localStorage.setItem('currentUser', JSON.stringify(mockUser));
  });

  // Verify auth is working
  await page.goto('/');

  // Should NOT redirect to login
  await expect(page).not.toHaveURL(/\/login/);

  // Should see authenticated UI (dashboard or chat)
  await expect(
    page.locator('[data-testid="dashboard"]').or(
      page.locator('[data-testid="chat-container"]')
    )
  ).toBeVisible({ timeout: 5000 });

  // Save storage state for other tests
  await context.storageState({ path: authFile });

  console.log('✅ Authentication setup complete');
});
```

### Test After Fix
```bash
pnpm test:e2e:headed
# Expected: 130/130 passing (currently 70/130)
```

---

## 🟡 HIGH PRIORITY FIX #3: Add Chat Component Tests (8 hours)
**Impact**: +10% coverage, validates critical user flow

### Files to Create

#### tests/unit/components/chat/Thread.test.tsx
```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Thread } from '@/components/chat/Thread';

describe('Thread', () => {
  it('renders empty state when no messages', () => {
    render(<Thread messages={[]} isLoading={false} isStreaming={false} />);
    expect(screen.getByText(/start a conversation/i)).toBeInTheDocument();
  });

  it('renders messages', () => {
    const messages = [
      { id: '1', role: 'user', content: 'Hello', created_at: new Date().toISOString() },
      { id: '2', role: 'assistant', content: 'Hi there!', created_at: new Date().toISOString() }
    ];
    render(<Thread messages={messages} isLoading={false} isStreaming={false} />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByText('Hi there!')).toBeInTheDocument();
  });

  it('shows loading indicator', () => {
    render(<Thread messages={[]} isLoading={true} isStreaming={false} />);
    expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
  });

  it('shows streaming indicator', () => {
    render(<Thread messages={[]} isLoading={false} isStreaming={true} />);
    expect(screen.getByTestId('streaming-indicator')).toBeInTheDocument();
  });

  // Add 20+ more tests...
});
```

#### tests/unit/components/chat/Composer.test.tsx
```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Composer } from '@/components/chat/Composer';

describe('Composer', () => {
  it('renders textarea', () => {
    render(<Composer onSendMessage={vi.fn()} disabled={false} model="gpt-4" />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('calls onSendMessage with text', async () => {
    const onSend = vi.fn();
    render(<Composer onSendMessage={onSend} disabled={false} model="gpt-4" />);

    const textarea = screen.getByRole('textbox');
    await fireEvent.change(textarea, { target: { value: 'Test message' } });

    const sendButton = screen.getByRole('button', { name: /send/i });
    await fireEvent.click(sendButton);

    expect(onSend).toHaveBeenCalledWith('Test message');
  });

  it('clears input after sending', async () => {
    render(<Composer onSendMessage={vi.fn()} disabled={false} model="gpt-4" />);

    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
    await fireEvent.change(textarea, { target: { value: 'Test' } });
    await fireEvent.click(screen.getByRole('button', { name: /send/i }));

    expect(textarea.value).toBe('');
  });

  it('sends on Enter key', async () => {
    const onSend = vi.fn();
    render(<Composer onSendMessage={onSend} disabled={false} model="gpt-4" />);

    const textarea = screen.getByRole('textbox');
    await fireEvent.change(textarea, { target: { value: 'Test' } });
    await fireEvent.keyDown(textarea, { key: 'Enter', code: 'Enter' });

    expect(onSend).toHaveBeenCalledWith('Test');
  });

  it('adds newline on Shift+Enter', async () => {
    render(<Composer onSendMessage={vi.fn()} disabled={false} model="gpt-4" />);

    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
    await fireEvent.change(textarea, { target: { value: 'Line 1' } });
    await fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: true });

    // Should add newline, not send
    expect(textarea.value).toContain('\n');
  });

  // Add 20+ more tests...
});
```

#### tests/unit/components/chat/ConversationList.test.tsx
```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ConversationList } from '@/components/chat/ConversationList';

describe('ConversationList', () => {
  const mockConversations = [
    { id: '1', title: 'Test Chat 1', created_at: new Date().toISOString() },
    { id: '2', title: 'Test Chat 2', created_at: new Date().toISOString() }
  ];

  it('renders conversations', () => {
    render(
      <ConversationList
        conversations={mockConversations}
        folders={[]}
        currentConversationId="1"
        onSelectConversation={vi.fn()}
        onDeleteConversation={vi.fn()}
        onCreateNew={vi.fn()}
        loading={false}
      />
    );

    expect(screen.getByText('Test Chat 1')).toBeInTheDocument();
    expect(screen.getByText('Test Chat 2')).toBeInTheDocument();
  });

  it('highlights current conversation', () => {
    render(
      <ConversationList
        conversations={mockConversations}
        folders={[]}
        currentConversationId="1"
        onSelectConversation={vi.fn()}
        onDeleteConversation={vi.fn()}
        onCreateNew={vi.fn()}
        loading={false}
      />
    );

    const currentItem = screen.getByText('Test Chat 1').closest('div');
    expect(currentItem).toHaveClass(/active|selected|current/);
  });

  // Add 30+ more tests...
});
```

---

## 🟡 HIGH PRIORITY FIX #4: Add Modal Component Tests (8 hours)
**Impact**: +8% coverage

### Create tests for all 11 modals:
1. `CreatePromptModal.test.tsx`
2. `CreateAutomationModal.test.tsx`
3. `ShareAgentModal.test.tsx`
4. `ExportConversationModal.test.tsx` (NEW)
5. `ShareConversationModal.test.tsx` (NEW)
6. `ProfileModal.test.tsx`
7. `PreferencesModal.test.tsx`
8. `ApiKeysModal.test.tsx`
9. `BillingModal.test.tsx`
10. `AdvancedSettingsModal.test.tsx`
11. `RequestModelModal.test.tsx`

Each modal should have ~15-20 tests covering:
- Rendering
- Form validation
- Submit handling
- Cancel/close behavior
- Error states
- Success states

---

## 🟡 HIGH PRIORITY FIX #5: Add Service Tests (16 hours)
**Impact**: +15% coverage

### Priority Order

#### 1. agentService.test.ts (3h)
```typescript
describe('AgentService', () => {
  describe('createAgent', () => {
    it('creates agent with valid data');
    it('validates required fields');
    it('handles Supabase errors');
  });

  describe('executeAgent', () => {
    it('executes agent workflow');
    it('handles n8n integration');
    it('logs execution results');
  });

  // 20+ more tests
});
```

#### 2. automationService.test.ts (3h)
```typescript
describe('AutomationService', () => {
  describe('createAutomation', () => {
    it('creates from template');
    it('creates custom automation');
    it('validates trigger configuration');
  });

  describe('executeAutomation', () => {
    it('handles scheduled triggers');
    it('handles webhook triggers');
    it('uses correct credentials');
  });

  // 25+ more tests
});
```

#### 3. edgeVaultService.test.ts (3h)
```typescript
describe('EdgeVaultService', () => {
  describe('encryption', () => {
    it('encrypts credentials before storage');
    it('decrypts on retrieval');
    it('handles encryption errors');
  });

  describe('access control', () => {
    it('restricts access by user');
    it('allows team sharing');
    it('logs all access');
  });

  // 20+ more tests
});
```

#### 4. aiGalleryService.test.ts (2h)
#### 5. adminService.test.ts (2h)
#### 6. n8nService.test.ts (2h)
#### 7. promptFeedService.test.ts (1h)

---

## 🟢 MEDIUM PRIORITY: Add Missing Hook Tests (12 hours)
**Impact**: +12% coverage

Files needed:
- `useEdgeVault.test.ts`
- `useAIGallery.test.ts`
- `useAgents.test.ts`
- `useAutomations.test.ts`
- `useSiaMemory.test.ts`
- `useAdmin.test.ts`
- `useN8NWorkflows.test.ts`
- `useAnalytics.test.ts`
- `useSupabaseAgents.test.ts`
- `useSupabaseData.test.ts`
- `useVirtualKeys.test.ts`
- `useTools.test.ts`

Each needs ~20-25 tests.

---

## 🟢 MEDIUM PRIORITY: Add Dashboard Component Tests (4 hours)
**Impact**: +3% coverage

Files needed:
- `MetricCard.test.tsx`
- `QuickActionsGrid.test.tsx`
- `RecentActivity.test.tsx`
- `SparklineChart.test.tsx`

---

## Timeline to 70% Coverage

### Week 1 (40 hours)
**Day 1-2**: Critical Fixes
- ✅ Fix Supabase mock (2h)
- ✅ Fix E2E auth setup (2h)
- Test all integration tests pass (1h)
- Test E2E tests pass (1h)

**Day 3-4**: Chat Components
- Thread tests (3h)
- Composer tests (3h)
- ConversationList tests (4h)
- Inspector tests (3h)
- MarkdownRenderer tests (3h)

**Day 5**: Modal Components Part 1
- CreatePromptModal (1h)
- CreateAutomationModal (1h)
- ShareAgentModal (1h)
- ExportConversationModal (1h)
- ShareConversationModal (1h)
- ProfileModal (2h)

**Coverage after Week 1**: ~30%

### Week 2 (40 hours)
**Day 1**: Modal Components Part 2
- Remaining 5 modals (8h)

**Day 2-4**: Service Tests
- agentService (3h)
- automationService (3h)
- edgeVaultService (3h)
- aiGalleryService (2h)
- adminService (2h)
- n8nService (2h)
- promptFeedService (1h)
- 4 more services (8h)

**Day 5**: Dashboard & Misc
- Dashboard components (4h)
- Cleanup and fixes (4h)

**Coverage after Week 2**: ~55%

### Week 3 (40 hours)
**Day 1-3**: Hook Tests
- 12 missing hook test files (24h)

**Day 4**: Integration Tests
- Agent workflow integration (4h)
- Automation execution integration (4h)

**Day 5**: Polish & Verification
- Fix any remaining failures (4h)
- Verify coverage reports (2h)
- Update CI configuration (2h)

**Coverage after Week 3**: 70%+ ✅

---

## Quick Win Checklist (Next 8 Hours)

```
Priority tasks to get immediate results:

Hour 1-2: Critical Mock Fix
[ ] Update tests/__mocks__/supabase.ts
[ ] Run pnpm test:integration
[ ] Verify 17/17 passing

Hour 3-4: E2E Auth Fix
[ ] Update tests/e2e/auth.setup.ts
[ ] Run pnpm test:e2e:headed
[ ] Verify auth tests pass

Hour 5-6: Thread Component Tests
[ ] Create tests/unit/components/chat/Thread.test.tsx
[ ] Write 20 tests
[ ] Run and verify all pass

Hour 7-8: Composer Component Tests
[ ] Create tests/unit/components/chat/Composer.test.tsx
[ ] Write 20 tests
[ ] Run pnpm test:coverage
[ ] Verify coverage increased to 15%+
```

After these 8 hours, you should have:
- ✅ All integration tests passing
- ✅ All E2E tests passing
- ✅ Coverage above 15% (up from 8.79%)
- ✅ Foundation for rapid test expansion

---

## Success Metrics

### After Critical Fixes (4h)
- ✅ Integration tests: 17/17 passing (100%)
- ✅ E2E tests: 130/130 passing (100%)
- ✅ Coverage: Still ~9% but foundation solid

### After Week 1 (40h)
- ✅ Coverage: 30%+
- ✅ Chat fully tested
- ✅ Modals half tested
- ✅ All E2E passing

### After Week 2 (80h)
- ✅ Coverage: 55%+
- ✅ All modals tested
- ✅ All services tested
- ✅ Dashboard tested

### After Week 3 (120h) - PRODUCTION READY
- ✅ Coverage: 70%+ (MEETS REQUIREMENT)
- ✅ All hooks tested
- ✅ Integration tests complete
- ✅ Ready for CI/CD deployment

---

## Commands to Track Progress

```bash
# After each fix, run full test suite
pnpm test:all

# Check coverage increase
pnpm test:coverage
cat reports/coverage/coverage-summary.json

# Verify E2E visually
pnpm test:e2e:headed

# Generate reports
pnpm test:all 2>&1 | tee test-results-$(date +%Y%m%d).txt
```

---

## Notes

- All test examples above are skeletons - expand each to 15-25 tests per file
- Use existing test patterns from passing tests as reference
- Focus on critical paths first (user journeys)
- Add edge cases and error handling last
- Maintain test data fixtures in `tests/__mocks__/`
- Use `test-utils.tsx` for common render wrappers
