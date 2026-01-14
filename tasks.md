# Tasks: Automations Page - Perfect Visualization & Node Connections

**Input**: Analysis of `changes-made-spec`, `REAL-STATUS.md`, and current Automations implementation
**Prerequisites**: WorkflowBuilder.tsx, WorkflowNodes.tsx, animated-border-trail.tsx, animated-beam.tsx exist

**Context**: The user has made progress on visual improvements (button-shaped nodes, animated border trail, color-coded trails) but needs "perfect visualization, node connections, etc."

## Current State Summary

**Done:**
- Button-shaped nodes with rounded corners (rounded-sm)
- AnimatedBorderTrail component for selected/active nodes
- Color-coded trail animation per node type (green for Start, red for Gmail, etc.)
- Basic GSuite, Jira, Slack, and other connector nodes
- AnimatedSvgEdge with dash animation for connections
- Tool palette with expandable menus
- Right configuration panel (floating)

**Pending (from REAL-STATUS.md):**
- Fix error display
- Show real automations properly
- Remove dummy data
- Edge connections need AnimatedBeam integration (created but not integrated)
- Node connection handles need polish
- Missing edge labels for branching logic
- No mini-map for large workflows
- Missing undo/redo functionality

---

## Phase 1: Setup (Infrastructure)

**Purpose**: Ensure all animation infrastructure is properly configured

- [ ] T001 Verify @property --angle CSS rule works in all browsers in src/index.css
- [ ] T002 [P] Ensure motion/react (framer-motion v12) is installed and configured in package.json
- [ ] T003 [P] Verify ReactFlow edge types include animated type in src/components/automations/WorkflowBuilder.tsx

---

## Phase 2: Foundational (Edge Connection System)

**Purpose**: Core edge/connection improvements that all visual features depend on

**⚠️ CRITICAL**: Node connection visualization must be perfect before other features

- [ ] T004 Replace current AnimatedSvgEdge with AnimatedBeam integration in src/components/automations/WorkflowBuilder.tsx
- [ ] T005 Create custom edge component using AnimatedBeam from src/components/ui/animated-beam.tsx for workflow connections
- [ ] T006 [P] Implement edge color inheritance from source node type (Start→green, Gmail→red, etc.)
- [ ] T007 [P] Add edge hover state with glow effect matching node trail color
- [ ] T008 Implement smooth bezier curves for edges using getSmoothStepPath with better curvature
- [ ] T009 Add connection validation to prevent invalid node-to-node links in WorkflowBuilder.tsx

**Checkpoint**: Edge connections should now animate beautifully between nodes with color-matched beams

---

## Phase 3: User Story 1 - Perfect Node Visualization (Priority: P1) 🎯 MVP

**Goal**: Make workflow nodes visually stunning with perfect connection handles and states

**Independent Test**: Select any node - border trail animates smoothly; connect two nodes - beam flows from source to target

### Implementation for User Story 1

- [ ] T010 [US1] Fix node handle positioning to be perfectly centered on node edges in src/components/automations/WorkflowNodes.tsx
- [ ] T011 [P] [US1] Add handle hover animation (scale up, color highlight) for all node types
- [ ] T012 [P] [US1] Implement handle connection preview line when dragging from handle
- [ ] T013 [US1] Add node shadow/glow on hover state matching node color in WorkflowNodes.tsx
- [ ] T014 [P] [US1] Create distinct visual states: default, hover, selected, connecting, error
- [ ] T015 [US1] Fix GenericNode component to properly apply dynamic border color (currently broken template literal) in WorkflowNodes.tsx:201
- [ ] T016 [P] [US1] Add subtle pulse animation to Start node handle to indicate "connect from here"
- [ ] T017 [US1] Implement node icon color consistency - ensure icon colors match trail colors for all node types

**Checkpoint**: Nodes should look polished with proper handle positioning, hover states, and visual feedback

---

## Phase 4: User Story 2 - Enhanced Edge Visualization (Priority: P2)

**Goal**: Make connections between nodes beautiful and informative

**Independent Test**: Connect Start→Agent→Gmail - all edges animate with appropriate colors and labels

### Implementation for User Story 2

- [ ] T018 [P] [US2] Create EdgeLabel component for displaying edge conditions/labels in src/components/automations/EdgeLabel.tsx
- [ ] T019 [US2] Implement edge label positioning at midpoint of bezier curve
- [ ] T020 [P] [US2] Add edge delete button on hover (X icon at edge midpoint)
- [ ] T021 [US2] Implement conditional edge styling for If/Else branches (green for true, red for false)
- [ ] T022 [P] [US2] Add data flow particle animation along edges (dots moving from source to target)
- [ ] T023 [US2] Create edge tooltip showing connection info on hover
- [ ] T024 [US2] Implement animated connection path when dragging to create new edge

**Checkpoint**: Edges should animate beautifully with labels, particles, and intuitive interaction

---

## Phase 5: User Story 3 - Workflow Canvas Enhancements (Priority: P3)

**Goal**: Add professional canvas features for better workflow management

**Independent Test**: Open WorkflowBuilder - minimap shows workflow overview; undo restores last action

### Implementation for User Story 3

- [ ] T025 [P] [US3] Add MiniMap component from @xyflow/react to WorkflowBuilder.tsx
- [ ] T026 [P] [US3] Style MiniMap with dark theme matching canvas background
- [ ] T027 [US3] Implement undo/redo functionality using useHistoryState in WorkflowBuilder.tsx
- [ ] T028 [P] [US3] Add keyboard shortcuts: Ctrl+Z (undo), Ctrl+Y (redo), Delete (remove node)
- [ ] T029 [US3] Create zoom controls with smooth animation (zoom to fit, zoom in/out buttons)
- [ ] T030 [P] [US3] Add grid snap toggle button to floating toolbar
- [ ] T031 [US3] Implement auto-layout button to arrange nodes automatically

**Checkpoint**: Canvas should feel professional with minimap, history, and keyboard shortcuts

---

## Phase 6: User Story 4 - Node Configuration Polish (Priority: P4)

**Goal**: Perfect the right-side configuration panel for all node types

**Independent Test**: Select Gmail node - panel shows Gmail-specific configuration options

### Implementation for User Story 4

- [ ] T032 [P] [US4] Create node-specific configuration forms for Gmail in src/components/automations/configs/GmailConfig.tsx
- [ ] T033 [P] [US4] Create node-specific configuration forms for Slack in src/components/automations/configs/SlackConfig.tsx
- [ ] T034 [P] [US4] Create node-specific configuration forms for Jira in src/components/automations/configs/JiraConfig.tsx
- [ ] T035 [US4] Implement configuration validation with inline error messages
- [ ] T036 [P] [US4] Add configuration presets/templates for common setups
- [ ] T037 [US4] Create "Test Connection" button for integration nodes
- [ ] T038 [US4] Add real-time preview of node output in config panel

**Checkpoint**: Each node type should have tailored configuration UI with validation

---

## Phase 7: User Story 5 - Real Data Integration (Priority: P5)

**Goal**: Remove dummy data and connect to real automations from Supabase

**Independent Test**: Dashboard shows actual automations from database; clicking opens correct workflow

### Implementation for User Story 5

- [ ] T039 [US5] Create useAutomations hook to fetch real automations from Supabase in src/hooks/useAutomations.ts
- [ ] T040 [US5] Replace mock automations array in AutomationsDashboard.tsx with real data hook
- [ ] T041 [P] [US5] Create automation CRUD operations (create, update, delete) in Supabase
- [ ] T042 [US5] Implement workflow save/load functionality with Supabase in WorkflowBuilder.tsx
- [ ] T043 [P] [US5] Add loading states and error handling for data operations
- [ ] T044 [US5] Create automation status (active/inactive/draft) toggle functionality
- [ ] T045 [US5] Implement automation execution trigger from dashboard

**Checkpoint**: Automations page should display and manage real data from Supabase

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Final refinements and cross-cutting improvements

- [ ] T046 [P] Performance optimization - memoize node components properly
- [ ] T047 [P] Add proper TypeScript types for all workflow-related interfaces
- [ ] T048 Dark mode verification - test all node/edge colors in dark mode
- [ ] T049 Light mode verification - test all node/edge colors in light mode
- [ ] T050 [P] Add loading skeleton for WorkflowBuilder initial load
- [ ] T051 Console error cleanup - fix any React key warnings or missing dependencies
- [ ] T052 Accessibility - add ARIA labels to workflow canvas and controls
- [ ] T053 Mobile responsiveness - ensure tool palette works on tablet

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - verify infrastructure
- **Foundational (Phase 2)**: Depends on Setup - edge system blocks node connections
- **US1 Node Viz (Phase 3)**: Depends on Foundational - nodes need edge system
- **US2 Edge Viz (Phase 4)**: Depends on US1 - edges connect nodes
- **US3 Canvas (Phase 5)**: Can start after Foundational
- **US4 Config (Phase 6)**: Can start after US1
- **US5 Real Data (Phase 7)**: Can start after Foundational
- **Polish (Phase 8)**: Depends on US1-US5 being complete

### Parallel Opportunities

```bash
# Phase 2 parallelizable tasks:
T006 "Edge color inheritance" | T007 "Edge hover state"

# Phase 3 (US1) parallelizable tasks:
T011 "Handle hover animation" | T012 "Handle connection preview"
T014 "Visual states" | T016 "Start node pulse"

# Phase 4 (US2) parallelizable tasks:
T018 "EdgeLabel component" | T020 "Edge delete button" | T022 "Particle animation"

# Phase 6 (US4) parallelizable - all config components:
T032 "GmailConfig" | T033 "SlackConfig" | T034 "JiraConfig"
```

### Within Each User Story

- Fix existing broken code first (T015 GenericNode border color)
- Visual improvements before interactions
- Core features before advanced features

---

## Implementation Strategy

### MVP First (Phase 1-3 Only)

1. Complete Phase 1: Setup verification
2. Complete Phase 2: Fix edge connections with AnimatedBeam
3. Complete Phase 3: Perfect node visualization
4. **STOP and VALIDATE**: Workflow builder looks and feels professional

### Incremental Delivery

1. Setup + Foundational → Edge system works beautifully
2. Add US1 (Node Viz) → Nodes are polished and professional
3. Add US2 (Edge Viz) → Connections have labels and animations
4. Add US3 (Canvas) → Full workflow editing experience
5. Add US4 (Config) → Complete node configuration
6. Add US5 (Real Data) → Production-ready

---

## Priority Fixes (Do These First!)

Based on code analysis, these are the most impactful quick wins:

1. **T015** - Fix GenericNode border color template literal bug (line 201)
2. **T004/T005** - Integrate AnimatedBeam for edge connections (already built, not used!)
3. **T010** - Fix handle positioning (currently using !-right-1 which may not align)
4. **T006** - Color-match edges to source node (makes workflow readable)

---

## Notes

- [P] tasks = different files, no dependencies
- [US#] label maps task to specific user story
- AnimatedBeam component exists at src/components/ui/animated-beam.tsx but isn't integrated into WorkflowBuilder yet
- The GenericNode has a bug at line 201: `border-[${color}]/50` - Tailwind can't parse dynamic bracket values
- Current AnimatedSvgEdge uses simple dash animation, should use AnimatedBeam gradient effect instead
