# OneEdge - Unified AI Platform

## Overview
OneEdge is a unified AI platform by OneOrigin that provides features for:
- Chat interface with AI models
- Agent workflows and automation
- Prompt library management
- Tools gallery
- Models hub

## Project Structure
```
src/
├── components/       # React components
│   ├── agents/       # Agent workflow nodes
│   ├── automations/  # Automation modals
│   ├── chat/         # Chat interface components
│   ├── modals/       # Various modal dialogs
│   ├── shell/        # App shell (SideNav, TopBar, Footer)
│   └── ui/           # Shadcn UI components
├── hooks/            # Custom React hooks
├── lib/              # Utility functions
├── pages/            # Page components (routes)
├── services/         # API and backend services
└── types/            # TypeScript type definitions
```

## Tech Stack
- **Frontend**: React 18, TypeScript, Vite
- **Styling**: TailwindCSS, Shadcn UI components
- **State Management**: TanStack React Query
- **Routing**: React Router DOM v6
- **Backend**: Supabase (authentication, database, realtime)
- **Workflow Visualization**: @xyflow/react

## Development
- Run `npm run dev` to start the development server on port 5000
- The app requires Supabase environment variables for authentication

## Recent Changes
- December 31, 2025: Fixed dashboard layout
  - Made header (TopBar) fixed at top with h-14 height
  - Made footer fixed at bottom with h-12 height
  - Narrowed sidebar from w-64 to w-52 (collapsed: w-14)
  - Sidebar now starts below header and ends above footer
  - Moved collapse button to bottom of sidebar as icon-only
  - Main content area adjusts padding based on sidebar state
- December 31, 2025: Renamed from OneAI to OneEdge
  - Updated all references across the codebase
- December 31, 2025: Migrated from Lovable to Replit environment
  - Updated vite.config.ts to run on port 5000 with allowedHosts: true
  - Installed dependencies with npm

## User Preferences
- None documented yet

## Environment Variables
This project uses Supabase and requires:
- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY
