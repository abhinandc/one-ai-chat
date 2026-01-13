# OneEdge Automation Templates

This document describes the 13 pre-built automation templates available in OneEdge.

## Overview

Automation templates are admin-maintained workflows that employees can use as starting points for their own automations. Each template includes:

- Complete workflow structure (trigger, steps, outputs)
- Required credentials/integrations
- Default AI model recommendation
- Usage tracking

## Template Categories

### GSuite Automations (5 templates)

#### 1. Email Summarizer
- **Description**: Automatically summarize unread emails and send a daily digest
- **Trigger**: Schedule (Daily at 9:00 AM)
- **Steps**:
  1. Fetch unread emails from Gmail
  2. AI summarizes emails, groups by sender, highlights urgent items
  3. Send digest email to user
- **Required Credentials**: Google
- **Default Model**: claude-3-haiku-20240307
- **Featured**: Yes

#### 2. Email Forwarder
- **Description**: Forward emails from specific sender to recipient with AI filtering
- **Trigger**: Webhook (gmail.message.received)
- **Steps**:
  1. Filter by sender
  2. AI analyzes if email should be forwarded
  3. Forward email if approved
- **Required Credentials**: Google
- **Default Model**: gpt-4o-mini

#### 3. Calendar Prep
- **Description**: Prepare meeting notes before calendar events
- **Trigger**: Schedule (Every 30 minutes)
- **Steps**:
  1. Fetch upcoming calendar events (next hour)
  2. AI generates meeting prep notes
  3. Create Google Doc with notes
  4. Send notification email
- **Required Credentials**: Google
- **Default Model**: claude-3-sonnet-20240229
- **Featured**: Yes

#### 4. Doc Drafter
- **Description**: Draft Google Docs from prompts and templates
- **Trigger**: Manual
- **Steps**:
  1. AI generates document content from prompt
  2. Create Google Doc
  3. Share document with user
- **Required Credentials**: Google
- **Default Model**: gpt-4

#### 5. Sheet Analyzer
- **Description**: Analyze Google Sheets data and generate insights
- **Trigger**: Manual
- **Steps**:
  1. Fetch spreadsheet data
  2. AI analyzes for trends, outliers, insights
  3. Create analysis report in Google Docs
- **Required Credentials**: Google
- **Default Model**: claude-3-opus-20240229

---

### Slack Automations (3 templates)

#### 6. Channel Summarizer
- **Description**: Generate daily digest of Slack channel activity
- **Trigger**: Schedule (Daily at 6:00 PM)
- **Steps**:
  1. Fetch channel messages from last 24 hours
  2. AI summarizes key discussions, decisions, action items
  3. Post summary to channel
- **Required Credentials**: Slack
- **Default Model**: claude-3-haiku-20240307
- **Featured**: Yes

#### 7. Customer Email Responder
- **Description**: Draft responses to customer emails in Slack
- **Trigger**: Webhook (slack.message.channels)
- **Steps**:
  1. Detect @email mention in message
  2. AI drafts professional response
  3. Post draft as thread reply
- **Required Credentials**: Slack
- **Default Model**: gpt-4

#### 8. Mention Alerter
- **Description**: AI-summarized mention notifications
- **Trigger**: Webhook (slack.message.im)
- **Steps**:
  1. Fetch conversation thread context
  2. AI summarizes mention with key points
  3. Send DM with summary and link to thread
- **Required Credentials**: Slack
- **Default Model**: gpt-4o-mini

---

### Jira Automations (3 templates)

#### 9. Ticket Prioritizer
- **Description**: AI-prioritize new Jira tickets based on content
- **Trigger**: Webhook (jira:issue_created)
- **Steps**:
  1. AI analyzes ticket for priority (Critical/High/Medium/Low)
  2. Update ticket priority field
  3. Add comment with reasoning
- **Required Credentials**: Jira
- **Default Model**: claude-3-sonnet-20240229
- **Featured**: Yes

#### 10. Sprint Reporter
- **Description**: Generate sprint summary reports
- **Trigger**: Manual
- **Steps**:
  1. Fetch all sprint issues
  2. AI generates comprehensive report (completion rate, highlights, challenges)
  3. Create Confluence page with report
- **Required Credentials**: Jira
- **Default Model**: claude-3-opus-20240229

#### 11. Bug Analyzer
- **Description**: Analyze bug patterns and generate insights
- **Trigger**: Schedule (Weekly Monday 10:00 AM)
- **Steps**:
  1. Fetch bugs from last 7 days
  2. AI analyzes patterns, root causes, preventive measures
  3. Create Jira task with analysis report
- **Required Credentials**: Jira
- **Default Model**: gpt-4

---

### Google Chat Automations (2 templates)

#### 12. Space Responder
- **Description**: Draft responses to Google Chat space messages
- **Trigger**: Webhook (google.chat.message)
- **Steps**:
  1. Fetch thread context
  2. AI drafts helpful response
  3. Post response to space
- **Required Credentials**: Google
- **Default Model**: gpt-4

#### 13. Meeting Scheduler
- **Description**: AI-assisted meeting scheduling via Google Chat
- **Trigger**: Webhook (google.chat.message)
- **Steps**:
  1. AI detects scheduling intent, extracts details
  2. Check calendar availability
  3. AI suggests 3 optimal meeting times
  4. Send suggestions to chat
- **Required Credentials**: Google
- **Default Model**: claude-3-sonnet-20240229
- **Featured**: Yes

---

## Using Templates

### For Employees

1. Navigate to **Automations** page
2. Click the **Templates** tab
3. Browse available templates by category
4. Click **Use Template** on desired template
5. Confirm to create automation from template
6. Customize automation as needed

### For Admins

Admins can manage templates via:
- **Admin Settings UI** (`/admin`)
- **Direct database updates**
- **Supabase dashboard**

Template fields:
- `name`: Display name
- `description`: Template description
- `category`: gsuite | slack | jira | chat | custom
- `template_data`: JSONB workflow structure
- `required_credentials`: Array of integration types
- `default_model`: Suggested AI model
- `is_active`: Visibility to employees
- `is_featured`: Highlighted in UI
- `usage_count`: Tracks how many times template was used

## Template Data Structure

Each template's `template_data` field contains:

```json
{
  "trigger": {
    "type": "schedule | webhook | manual",
    "config": {
      "cron": "0 9 * * *",
      "event": "gmail.message.received",
      "description": "Human-readable trigger description"
    }
  },
  "steps": [
    {
      "id": "step_identifier",
      "type": "api_call | ai_model | condition",
      "action": "list_unread | summarize | etc",
      "config": {
        "system_prompt": "AI instructions",
        "temperature": 0.3,
        "max_tokens": 1000
      }
    }
  ],
  "outputs": [
    {
      "type": "email | document | message | notification",
      "destination": "user | slack | google_docs | etc"
    }
  ]
}
```

## Adding New Templates

### Via SQL

```sql
INSERT INTO public.automation_templates (
  name,
  description,
  category,
  template_data,
  required_credentials,
  default_model,
  is_active,
  is_featured
) VALUES (
  'Template Name',
  'Template description',
  'gsuite',
  '{"trigger": {...}, "steps": [...], "outputs": [...]}'::jsonb,
  ARRAY['google'],
  'claude-3-sonnet-20240229',
  true,
  false
);
```

### Via Admin Service

```typescript
import { adminService } from '@/services/adminService';

await adminService.createAutomationTemplate({
  name: 'Template Name',
  description: 'Template description',
  category: 'gsuite',
  template_data: {
    trigger: { ... },
    steps: [ ... ],
    outputs: [ ... ]
  },
  required_credentials: ['google'],
  default_model: 'claude-3-sonnet-20240229',
  is_active: true,
  is_featured: false
});
```

## RLS Policies

- **SELECT**: Employees see active templates only (`is_active = true`)
- **INSERT/UPDATE/DELETE**: Admin only

## Usage Tracking

When an employee creates an automation from a template:
1. Automation is created with template data
2. `usage_count` increments via RPC function
3. Templates sorted by usage count (popular first)

---

## Future Enhancements

- Template versioning
- Template sharing between organizations
- Template marketplace
- Custom template variables with fill-in forms
- Template preview/test mode
- Template categories per department
- AI-suggested templates based on usage patterns
