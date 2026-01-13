# Supabase Seeds

This directory contains seed data for the OneEdge platform.

## Available Seeds

### `automation_templates.sql`

Pre-built automation templates for common enterprise workflows.

**Categories:**
- **GSuite** (5 templates): Email Summarizer, Email Forwarder, Calendar Prep, Doc Drafter, Sheet Analyzer
- **Slack** (3 templates): Channel Summarizer, Customer Email Responder, Mention Alerter
- **Jira** (3 templates): Ticket Prioritizer, Sprint Reporter, Bug Analyzer
- **Google Chat** (2 templates): Space Responder, Meeting Scheduler

## Applying Seeds

Seeds are automatically applied when using `supabase db reset`.

### Local Development

```bash
# Reset database and apply migrations + seeds
npx supabase db reset

# Apply seeds without reset
npx supabase db seed
```

### Production

Seeds are applied once during initial setup. Updates to templates should be managed through the admin UI or direct database updates.

## Template Structure

Each template includes:
- **name**: Display name
- **description**: What the automation does
- **category**: gsuite | slack | jira | chat | custom
- **template_data**: Complete workflow structure (JSONB)
  - `trigger`: How automation starts (schedule, webhook, manual)
  - `steps`: Array of workflow steps (API calls, AI processing, conditions)
  - `outputs`: Expected results
- **required_credentials**: Integration types needed (google, slack, jira)
- **default_model**: Suggested AI model
- **is_active**: Visibility to employees
- **is_featured**: Highlighted in UI

## Modifying Templates

Admins can modify templates through:
1. Admin Settings UI (`/admin`)
2. Direct SQL updates
3. Edge Functions for dynamic modifications

## Security

Templates are visible to all authenticated users via RLS policies.
Only admins can create, update, or delete templates.
