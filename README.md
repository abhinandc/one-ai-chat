# OneEdge - Unified AI Platform

OneOrigin's enterprise AI platform providing controlled access to multiple AI models.

## Overview

OneEdge is an employee-facing AI platform that provides enterprise teams with:
- **Unified AI Access** - Single interface to access multiple AI models (Claude, GPT, Gemini, etc.)
- **Enterprise Governance** - Centralized control over model access, budgets, and usage
- **Process Automation** - AI-powered workflow automations integrated with enterprise stack
- **Knowledge Sharing** - Internal prompt engineering community with curated external feeds
- **Voice AI Assistant** - Sia, a persistent AI companion

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: TailwindCSS, shadcn/ui components
- **State Management**: TanStack React Query, Zustand
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **Auth**: Google OAuth (GSuite enterprise)

## Getting Started

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Run tests
pnpm test
```

## Environment Variables

Required in `.env`:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

## Project Structure

```
src/
├── components/       # React components
│   ├── ui/           # shadcn/ui components
│   ├── shell/        # App shell (SideNav, TopBar, Footer)
│   ├── chat/         # Chat interface components
│   ├── agents/       # Agent workflow components
│   └── automations/  # Automation components
├── hooks/            # Custom React hooks
├── pages/            # Page components (routes)
├── services/         # API and Supabase services
├── styles/           # Global styles and tokens
└── types/            # TypeScript type definitions
```

## License

Copyright 2025 OneOrigin. All rights reserved.
