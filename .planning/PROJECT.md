# OneEdge - AI Platform Improvements

## What This Is

OneEdge is an employee-facing AI platform that provides enterprise teams with controlled access to multiple AI models. It operates under EdgeAdmin governance (LiteLLM-style proxy pattern) where administrators manage API keys, allocate model access via virtual keys, and set usage limits. This planning scope covers fixing document processing and overhauling the chat UI.

## Core Value

**Smart attachment routing that reliably processes any document using the best available model** - when users upload PDFs/images/documents, the system intelligently routes to OpenAI/Claude vision models for processing (unless user explicitly selects a OneAI OCR model).

## Requirements

### Validated

- ✓ Chat interface with multi-model support — existing
- ✓ Streaming responses via SSE — existing
- ✓ Model selection from virtual keys — existing
- ✓ File attachment upload (images, PDFs, text files) — existing
- ✓ Supabase Edge Function proxy (llm-proxy) — existing
- ✓ User authentication via Supabase — existing

### Active

**Document Processing (Priority):**
- [ ] Smart attachment routing - use OpenAI/Claude for document processing by default
- [ ] Only use OneAI OCR (op3 model) when user explicitly selects it
- [ ] Proper Anthropic image format conversion for Claude models
- [ ] Vision model detection for all Claude 4.x models

**Chat Page Overhaul:**
- [ ] Complete chat page UI overhaul with cult-ui components
- [ ] AI tool use mode with document/research processing visualization
- [ ] Fix thinking mode (currently not working)
- [ ] Chain-of-thought visualization for thinking mode
- [ ] AI artifact table for structured data display
- [ ] Multi-step tool usage pattern UI
- [ ] Animated pulse on center circle
- [ ] Smooth animations (remove buggy plugin feel)
- [ ] Code block and terminal components
- [ ] Loading states with prompt-kit loaders
- [ ] Animated dialogs (animate-ui)

**Model Settings & Persistence:**
- [ ] Right slider model settings - all functional and useful
- [ ] Save all settings against user table in Supabase
- [ ] Auto-load correct 4 models on home screen based on user message (rank-based)
- [ ] Common ranking logic driven by Supabase backend
- [ ] Modern close icon to return to dashboard from message input

**Model Hub:**
- [ ] Ensure data flows properly from edge function and Supabase tables
- [ ] Load and track specific model endpoints without confusing user
- [ ] Fetch all details from models added via EdgeAdmin
- [ ] Auto-load correct endpoint model based on chat message type (code, chat, image)
- [ ] Notify user if specific endpoint not available for requested type
- [ ] No dummy/demo content - all real data from Supabase

**Agents Page:**
- [ ] Save n8n details in Supabase against the user
- [ ] Redesign page with useful components for employees
- [ ] Build agents / share agents functionality
- [ ] All agent data stored against user in Supabase

**Automations Page:**
- [ ] Completely reimagine design - comprehensive automation builder
- [ ] Process automations relevant to employees
- [ ] Use agents from Agents page or shared agents
- [ ] MCP configuration support

### Out of Scope

- Mobile app (Flutter) — separate milestone later
- EdgeAdmin changes — separate app
- New model integrations — only use models already in llm_models table
- Sia voice assistant — future phase
- Automation templates — future phase

## Context

**Current State:**
- llm-proxy edge function (v45) deployed but document processing still failing
- OneAI OCR API calls failing silently (authentication or API key issues)
- Vision detection updated for Claude 4.x but still not working end-to-end
- Chat UI is functional but basic - needs modern component overhaul

**Technical Environment:**
- Frontend: React 18 + Vite + TypeScript + shadcn/ui
- Backend: Supabase Edge Functions (Deno)
- AI Gateway: OneAI (op3 for OCR, various models for chat)
- Database: Supabase PostgreSQL with RLS

**Key Files:**
- `supabase/functions/llm-proxy/index.ts` — main edge function
- `src/components/chat/AdvancedAIInput.tsx` — chat input component
- `src/hooks/useChat.ts` — chat state management
- `src/lib/api.ts` — API client

**UI Components to Install:**
- cult-ui-pro: ai-chat-agent-orchestrater-pattern, ai-artifact-table, ai-chat-agent-multi-step-tool-pattern
- animate-ui: radix-dialog, radix-sidebar
- prompt-kit: loader, chain-of-thought
- ai-elements: code-block, terminal
- chamaac: interactive-grid-background

**Cult-UI Pro Token:** cult_GAsrdidv5kqDDFjgReINXY0C1Nuzyiu3

## Constraints

- **Architecture**: Must keep Supabase Edge Functions — no moving to different backend
- **Budget**: Prefer cost-effective models for document processing when possible
- **Model Access**: Only use models already configured in Supabase llm_models table (controlled by EdgeAdmin)
- **Virtual Keys**: Employee access determined by EdgeAdmin virtual key allocations
- **Supabase Project**: vzrnxiowtshzspybrxeq (shared with EdgeAdmin)
- **No Demo Data**: All data must be real, fetched from Supabase - no dummy content

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Use OpenAI/Claude vision by default for documents | OneAI OCR (op3) was unreliable, failing silently | — Pending |
| Only use OneAI OCR when explicitly selected | Gives users option for specialized OCR when needed | — Pending |
| Overhaul chat UI with cult-ui components | Modern UX with tool visualization, thinking mode | — Pending |

---
*Last updated: 2025-01-20 after initialization*
