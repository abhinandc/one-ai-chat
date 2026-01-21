# Roadmap: OneEdge AI Platform Improvements

## Overview

Transform OneEdge from a functional but basic AI platform into a polished, enterprise-ready employee-facing application. Starting with critical document processing fixes, progressing through comprehensive chat UI overhaul with cult-ui components, building Supabase-backed features for query logging/prompts/tools, and culminating in agents and automations integration.

## Domain Expertise

None

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Document Processing Fix** - Smart attachment routing with OpenAI/Claude vision
- [x] **Phase 2: Chat UI Foundation** - Install cult-ui components, AI chat patterns
- [x] **Phase 3: Thinking Mode** - Fix thinking mode, chain-of-thought visualization
- [x] **Phase 4: AI Artifacts & Tools UI** - Artifact table, multi-step tool pattern, code blocks
- [x] **Phase 5: Chat Polish** - Animations, loading states, center circle pulse
- [x] **Phase 6: Query Logger** - Supabase context/memory logging for employees
- [x] **Phase 7: Model Settings & Persistence** - Right slider settings, Supabase persistence
- [x] **Phase 8: Model Hub Improvements** - Minor fixes, ensure real data flow
- [x] **Phase 9: Prompts Page** - Template loading, employee CRUD, sharing
- [x] **Phase 10: Playground** - Model testing interface
- [x] **Phase 11: Tools Page** - AI tool request forum with admin approval
- [x] **Phase 12: Agents & Automations** - n8n integration, automation builder, MCP config

### FIX PHASES (Delivering Original Requirements)

- [ ] **Phase 13: cult-ui-pro Installation** - Install actual cult-ui components, prompt-kit, animate-ui
- [ ] **Phase 14: Thinking Mode Fix** - Tool usage display, chain-of-thought visualization, image processing
- [ ] **Phase 15: Agents Rework** - Remove dummy data, real virtual keys, personality config
- [ ] **Phase 16: Automations Rework** - Functional automation builder, real integrations
- [ ] **Phase 17: Prompts Enhancement** - Daily-refresh public prompts, favorites system
- [ ] **Phase 18: Home Page & Chat Polish** - Proper animations, cult-ui integration throughout

## Phase Details

### Phase 1: Document Processing Fix
**Goal**: Smart attachment routing - use OpenAI/Claude vision by default for documents, only use OneAI OCR (op3) when explicitly selected
**Depends on**: Nothing (first phase)
**Research**: Unlikely (existing llm-proxy patterns)
**Plans**: TBD

Key work:
- Fix Anthropic image format conversion for Claude models
- Vision model detection for all Claude 4.x models
- Default to OpenAI/Claude for document processing
- OneAI OCR only when user explicitly selects it

### Phase 2: Chat UI Foundation
**Goal**: Install cult-ui-pro components and establish AI chat agent patterns
**Depends on**: Phase 1
**Research**: Likely (cult-ui-pro installation)
**Research topics**: cult-ui-pro token usage, ai-chat-agent-orchestrator-pattern installation
**Plans**: TBD

Key work:
- Install cult-ui-pro components (token: cult_GAsrdidv5kqDDFjgReINXY0C1Nuzyiu3)
- Set up ai-chat-agent-orchestrator-pattern
- Restructure chat component architecture

### Phase 3: Thinking Mode
**Goal**: Fix broken thinking mode and implement chain-of-thought visualization
**Depends on**: Phase 2
**Research**: Unlikely (internal implementation)
**Plans**: TBD

Key work:
- Debug and fix thinking mode functionality
- Implement chain-of-thought visualization using prompt-kit
- Visual indicators for model "thinking" state

### Phase 4: AI Artifacts & Tools UI
**Goal**: Implement AI artifact table and multi-step tool usage pattern
**Depends on**: Phase 3
**Research**: Likely (cult-ui component APIs)
**Research topics**: ai-artifact-table usage, ai-chat-agent-multi-step-tool-pattern
**Plans**: TBD

Key work:
- AI artifact table for structured data display
- Multi-step tool usage pattern UI
- Code block and terminal components (ai-elements)

### Phase 5: Chat Polish
**Goal**: Smooth animations and polished loading states
**Depends on**: Phase 4
**Research**: Unlikely (animate-ui, styling)
**Plans**: TBD

Key work:
- Animated pulse on center circle
- Smooth animations (remove buggy plugin feel)
- Loading states with prompt-kit loaders
- Animated dialogs (animate-ui radix-dialog)

### Phase 6: Query Logger
**Goal**: Supabase-backed context/memory logging for employees
**Depends on**: Phase 5
**Research**: Unlikely (Supabase patterns established)
**Plans**: TBD

Key work:
- Create query_logs table in Supabase
- Log key contexts from conversations
- Employee-scoped memory storage
- Context retrieval for continuity

### Phase 7: Model Settings & Persistence
**Goal**: Functional right slider settings saved to Supabase
**Depends on**: Phase 6
**Research**: Unlikely (user_preferences table exists)
**Plans**: TBD

Key work:
- All right slider settings functional
- Save settings against user table in Supabase
- Auto-load user preferences on login
- Modern close icon to return to dashboard

### Phase 8: Model Hub Improvements
**Goal**: Minor improvements to ensure all data flows from Supabase (no hardcoding)
**Depends on**: Phase 7
**Research**: Unlikely (page already decent)
**Plans**: TBD

Key work:
- Verify data flows from EdgeAdmin virtual keys
- Auto-load correct endpoint by message type (code, chat, image)
- Notify user if endpoint not available for requested type
- Remove any remaining placeholder/demo content

### Phase 9: Prompts Page
**Goal**: Load templates from leading sources, enable employee CRUD and sharing
**Depends on**: Phase 8
**Research**: Likely (external prompt sources)
**Research topics**: Leading prompt sources APIs (PromptBase, FlowGPT, etc.), RSS/webhook patterns
**Plans**: TBD

Key work:
- Create prompt_feeds table for external sources
- Load great prompts from leading places as templates
- Update templates in Supabase for all employees
- Employee create/edit/delete own prompts
- Share prompts with other employees
- All data from Supabase - no hardcoding

### Phase 10: Playground
**Goal**: Model testing interface with parameter adjustments
**Depends on**: Phase 9
**Research**: Unlikely (internal patterns)
**Plans**: TBD

Key work:
- Test prompts with different models
- Parameter adjustments (temperature, max tokens, top_p)
- Save playground sessions to Supabase
- Export/share sessions

### Phase 11: Tools Page
**Goal**: Comprehensive AI tool request forum with admin approval workflow
**Depends on**: Phase 10
**Research**: Unlikely (Supabase workflow patterns)
**Plans**: TBD

Key work:
- Create ai_tool_requests table in Supabase
- Request form with justification field
- Admin approval workflow
- Status tracking (pending/approved/rejected)
- All data from Supabase - no placeholders

### Phase 12: Agents & Automations
**Goal**: n8n integration, agent sharing, comprehensive automation builder with MCP config
**Depends on**: Phase 11
**Research**: Likely (n8n API, MCP patterns)
**Research topics**: n8n API for workflow sync, MCP server configuration
**Plans**: TBD

Key work:
- Save n8n details in Supabase against user
- Agent building and sharing functionality
- Comprehensive automation builder
- Process automations for employees
- MCP configuration support
- All agent/automation data in Supabase

### Phase 13: cult-ui-pro Installation
**Goal**: Actually install and integrate cult-ui-pro components that were supposed to be in Phase 2
**Depends on**: Phase 12
**Research**: Required (cult-ui-pro docs, token usage)
**Plans**: TBD

Key work:
- Install cult-ui-pro with token: cult_GAsrdidv5kqDDFjgReINXY0C1Nuzyiu3
- Install prompt-kit for AI chat patterns
- Install animate-ui for smooth animations
- Configure Tailwind for new components
- Create AI chat wrapper component

### Phase 14: Thinking Mode Fix
**Goal**: Fix broken thinking mode - display tool usage, chain-of-thought, handle images
**Depends on**: Phase 13
**Research**: Unlikely (internal implementation with new components)
**Plans**: TBD

Key work:
- Fix tool usage display in chat (not hidden)
- Implement proper chain-of-thought visualization
- Fix image upload and processing
- Remove duplicate animations (blue dots vs 3 dots)
- Proper loading states for long operations
- Actual thinking mode toggle that works

### Phase 15: Agents Rework
**Goal**: Remove all dummy/hardcoded data, use real virtual keys, add personality config
**Depends on**: Phase 14
**Research**: Unlikely (Supabase patterns)
**Plans**: TBD

Key work:
- Remove ALL dummy/hardcoded model data
- Models dropdown from user's virtual keys ONLY
- Agent personality configuration (tone, expertise, behavior)
- Agent sharing between employees
- Custom system prompts per agent
- All data in Supabase - zero placeholders

### Phase 16: Automations Rework
**Goal**: Make automations page actually functional with real integrations
**Depends on**: Phase 15
**Research**: Likely (integration APIs)
**Plans**: TBD

Key work:
- Fix natural language automation creation (no hallucinations)
- Real integration connections (Slack, Email, etc.)
- Working automation triggers and actions
- Template library that actually works
- Execution history with real data
- All from Supabase - no fake data

### Phase 17: Prompts Enhancement
**Goal**: Daily-refresh popular prompts from public sources, proper favorites system
**Depends on**: Phase 16
**Research**: Required (public prompt APIs/sources)
**Plans**: TBD

Key work:
- Integrate public prompt sources (PromptBase, FlowGPT, etc.)
- Daily automatic refresh of community prompts
- Employees can favorite/save public prompts
- Popular/trending prompt discovery
- Real popularity metrics from usage data

### Phase 18: Home Page & Chat Polish
**Goal**: Proper animations using cult-ui throughout, polished UX
**Depends on**: Phase 17
**Research**: Unlikely (applying installed components)
**Plans**: TBD

Key work:
- Fix home page prompt press animation
- Integrate cult-ui components throughout app
- Smooth transitions between pages
- Proper loading states everywhere
- Center circle pulse animation (working)
- Consistent animation language across app

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → ... → 12 → 13 → ... → 18

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Document Processing Fix | 1/1 | Complete | 2025-01-21 |
| 2. Chat UI Foundation | 1/1 | Complete | 2025-01-21 |
| 3. Thinking Mode | 1/1 | Complete | 2025-01-21 |
| 4. AI Artifacts & Tools UI | 1/1 | Complete | 2025-01-21 |
| 5. Chat Polish | 1/1 | Complete | 2025-01-21 |
| 6. Query Logger | 1/1 | Complete | 2025-01-21 |
| 7. Model Settings & Persistence | 1/1 | Complete | 2025-01-21 |
| 8. Model Hub Improvements | 1/1 | Complete | 2025-01-21 |
| 9. Prompts Page | 1/1 | Complete | 2025-01-21 |
| 10. Playground | 1/1 | Complete | 2025-01-21 |
| 11. Tools Page | 1/1 | Complete | 2025-01-21 |
| 12. Agents & Automations | 1/1 | Complete | 2025-01-21 |
| **FIX PHASES** | | | |
| 13. cult-ui-pro Installation | 0/TBD | Not started | - |
| 14. Thinking Mode Fix | 0/TBD | Not started | - |
| 15. Agents Rework | 0/TBD | Not started | - |
| 16. Automations Rework | 0/TBD | Not started | - |
| 17. Prompts Enhancement | 0/TBD | Not started | - |
| 18. Home Page & Chat Polish | 0/TBD | Not started | - |

## Constraints

- **No placeholders/hardcoding** - All data must flow through Supabase
- **Architecture**: Must keep Supabase Edge Functions
- **Model Access**: Only use models from EdgeAdmin virtual keys or OneAI Gateway
- **Supabase Project**: vzrnxiowtshzspybrxeq (shared with EdgeAdmin)
- **OneAI Gateway**: https://api-oneai.oneorigin.us (local models)
