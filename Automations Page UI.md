## Automations Page UI Expectations

Visual spec to match the screenshots (non-negotiables)

Global layout
• Left rail (primary): 260px expanded, 72px collapsed, icon-first, section groups, subtle separators.
• Top command bar (sticky): search, environment selector (Personal / Team), “Create automation” CTA, user menu.
• Main canvas: a single large rounded surface (not a blank page) that feels like a “floating panel” on top of a deep background.
• Right contextual drawer: details, runs, approvals; opens as a glass sheet (not a full page nav).

Surface language (that Foundry “floating monitor” look)
• Background: radial glow + very light noise grain + faint dot-grid (dot grid only in dark mode or very faint in light).
• Panels: frosted glass (translucent fill) + 1px border + inner highlight line.
• Corners: 14–18px radius everywhere (cards 14, dialogs 16–20).
• Shadows: soft, layered; add a faint colored rim shadow in dark mode (blue/purple).

Typography
• Use SF Pro Display (system on macOS; load fallback for non-Apple if needed).
• Titles slightly heavier (500–600), body (400–450), labels (500), code/ids in mono.

Theme tokens (dark + light, same geometry)

Dark theme (Foundry-like)
• App bg: #050814 to #070B18 with radial glow
• Surface 1: rgba(255,255,255,0.04)
• Surface 2: rgba(255,255,255,0.06) (cards hovered / selected)
• Border: rgba(255,255,255,0.08)
• Text: #E6EAF2
• Muted: #9AA6BD
• Primary accent: OneOrigin Blue #3B9DFF
• Secondary glow: #8B5CF6 (used as gradient rim only, not as primary UI color)
• Success/Warning/Error: keep standard but slightly desaturated so it feels “studio”, not “dashboard”.

Light theme (same layout, different physics)
• App bg: #F6F8FF with very soft radial highlight
• Surface 1: rgba(255,255,255,0.72) (glass)
• Surface 2: rgba(255,255,255,0.88)
• Border: rgba(15,23,42,0.10)
• Text: #0B1220
• Muted: #51607A
• Primary accent stays the same (#3B9DFF)
• Purple glow becomes extremely subtle (only for focus states).

Rule: light mode must still feel “premium glass”, not flat white.

Automations page UI (inside OneEdge, not n8n)

Above-the-fold (the “studio” moment) 1. Hero glass card (full width)
• Title: “Automations”
• Subtitle: “Create small daily efficiency recipes. No workflow canvas.”
• Two entry points:
• “Describe an automation…” (natural language input)
• “Browse templates” (opens template drawer)
• Shows “Connected tools” chips (Google Workspace, Slack, etc.) 2. Quick metrics strip (minimal)
• Active, Runs today, Failed last 24h, Awaiting approvals
• Each is a compact pill with icon + count.

Main content 3. My automations grid (cards)
• Card shows: Name, trigger type, tool icons, status badge, last run, next run.
• Hover reveals: Run now, Edit, Share, Pause.
• Selecting a card opens right drawer (not a new page). 4. Templates rail (horizontal)
• Role-aware templates: “Daily standup summary”, “Invoice follow-up”, “Candidate scheduling”, “Drive folder watcher”.
• Template card includes: time-to-setup, required connections, approvals required.

Right drawer (the Foundry-like detail panel)

Tabs:
• Overview (human readable “IF → THEN” summary)
• Steps (vertical timeline list, linear only)
• Runs (table, drill into payload and error)
• Settings (schedule, notifications, retry policy)
• Access (personal/team, share roles, approval gates)

Creation flow (wizard, not canvas)

Single modal/drawer wizard with 4 steps: 1. Trigger (schedule/event-based) 2. Actions (2–6 linear steps; reorderable) 3. Permissions + test run (show scopes before connect) 4. Deploy (enable, notify, optional approval gates)

Hard constraint: no branching/loops in v1. Escalate advanced needs to your orchestration platform behind the scenes.

Shadcn component map (what to actually use)
• Layout: custom Sidebar + ScrollArea
• Nav: Accordion (section groups), Tooltip (collapsed mode)
• Top bar: CommandDialog (global search), Select, Button, Avatar
• Cards: Card, Badge, DropdownMenu
• Drawer: Sheet (right side), Tabs
• Tables: shadcn DataTable
• Create flow: Dialog or Sheet + custom Stepper + Separator
• States: Skeleton, Toast, Alert

Animation rules (amazing, but controlled)

Use Framer Motion with strict limits:
• Page load: fade + 10px rise; card stagger 60ms
• Card hover: scale 1.01 + shadow lift + border brighten
• Drawer: spring slide from right, blur-in background (subtle)
• Wizard steps: horizontal slide with progress bar
• Status: tiny pulse dot only for “Running”
• Respect prefers-reduced-motion

The key: motion should feel like “UI has mass”, not “UI is dancing”.

Functional scope that matches the UI promise

Minimum feature set to feel real:
• Google Workspace connectors: Gmail, Calendar, Drive, Sheets
• Runs log + error viewer + retry
• Share to Team space + role-based access
• Approval gates for risky actions (external email, external sharing)
• Strong permission screen (scopes displayed, audit trail)
