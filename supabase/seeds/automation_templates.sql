-- ============================================================================
-- Automation Templates Seed Data
-- Purpose: Pre-built automation templates for OneEdge platform
-- Created: 2026-01-09
-- ============================================================================

-- GSuite Automations
INSERT INTO public.automation_templates (id, name, description, category, template_data, required_credentials, default_model, is_active, is_featured)
VALUES
  (
    '00000000-0000-0000-0000-000000000001',
    'Email Summarizer',
    'Automatically summarize unread emails and send a daily digest',
    'gsuite',
    '{
      "trigger": {
        "type": "schedule",
        "config": {
          "cron": "0 9 * * *",
          "timezone": "UTC",
          "description": "Daily at 9:00 AM"
        }
      },
      "steps": [
        {
          "id": "fetch_emails",
          "type": "gmail_api",
          "action": "list_unread",
          "config": {
            "max_results": 50,
            "query": "is:unread"
          }
        },
        {
          "id": "ai_process",
          "type": "ai_model",
          "action": "summarize",
          "config": {
            "system_prompt": "Summarize the following emails concisely. Group by sender and highlight urgent items.",
            "temperature": 0.3,
            "max_tokens": 1000
          }
        },
        {
          "id": "send_digest",
          "type": "gmail_api",
          "action": "send_email",
          "config": {
            "to": "{{user.email}}",
            "subject": "Daily Email Digest - {{current_date}}",
            "body": "{{ai_process.output}}"
          }
        }
      ],
      "outputs": [
        {
          "type": "email",
          "destination": "user"
        }
      ]
    }',
    ARRAY['google'],
    'claude-3-haiku-20240307',
    true,
    true
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    'Email Forwarder',
    'Forward emails from specific sender to recipient with AI filtering',
    'gsuite',
    '{
      "trigger": {
        "type": "webhook",
        "config": {
          "event": "gmail.message.received",
          "description": "Triggered when new email arrives"
        }
      },
      "steps": [
        {
          "id": "filter_sender",
          "type": "condition",
          "config": {
            "field": "email.from",
            "operator": "contains",
            "value": "{{config.target_sender}}"
          }
        },
        {
          "id": "ai_analyze",
          "type": "ai_model",
          "action": "classify",
          "config": {
            "system_prompt": "Analyze this email and determine if it should be forwarded. Respond with YES or NO and a brief reason.",
            "temperature": 0.2,
            "max_tokens": 100
          }
        },
        {
          "id": "forward_email",
          "type": "gmail_api",
          "action": "forward",
          "config": {
            "to": "{{config.recipient_email}}",
            "note": "Auto-forwarded: {{ai_analyze.reason}}"
          },
          "condition": "{{ai_analyze.decision == \"YES\"}}"
        }
      ],
      "outputs": [
        {
          "type": "email",
          "destination": "config"
        }
      ]
    }',
    ARRAY['google'],
    'gpt-4o-mini',
    true,
    false
  ),
  (
    '00000000-0000-0000-0000-000000000003',
    'Calendar Prep',
    'Prepare meeting notes before calendar events',
    'gsuite',
    '{
      "trigger": {
        "type": "schedule",
        "config": {
          "cron": "*/30 * * * *",
          "timezone": "UTC",
          "description": "Every 30 minutes"
        }
      },
      "steps": [
        {
          "id": "fetch_upcoming",
          "type": "calendar_api",
          "action": "list_events",
          "config": {
            "time_min": "now",
            "time_max": "+1 hour",
            "max_results": 10
          }
        },
        {
          "id": "ai_generate_notes",
          "type": "ai_model",
          "action": "generate",
          "config": {
            "system_prompt": "Create meeting preparation notes including: agenda items, attendees, key topics, and suggested talking points.",
            "temperature": 0.5,
            "max_tokens": 500
          }
        },
        {
          "id": "create_doc",
          "type": "docs_api",
          "action": "create_document",
          "config": {
            "title": "Meeting Notes - {{event.summary}} - {{event.start}}",
            "content": "{{ai_generate_notes.output}}"
          }
        },
        {
          "id": "send_notification",
          "type": "gmail_api",
          "action": "send_email",
          "config": {
            "to": "{{user.email}}",
            "subject": "Meeting Prep: {{event.summary}}",
            "body": "Meeting notes created: {{create_doc.url}}"
          }
        }
      ],
      "outputs": [
        {
          "type": "document",
          "destination": "google_docs"
        }
      ]
    }',
    ARRAY['google'],
    'claude-3-sonnet-20240229',
    true,
    true
  ),
  (
    '00000000-0000-0000-0000-000000000004',
    'Doc Drafter',
    'Draft Google Docs from prompts and templates',
    'gsuite',
    '{
      "trigger": {
        "type": "manual",
        "config": {
          "description": "Manually triggered with prompt input"
        }
      },
      "steps": [
        {
          "id": "ai_generate_content",
          "type": "ai_model",
          "action": "generate",
          "config": {
            "system_prompt": "Generate a professional document based on the user prompt. Include proper formatting, sections, and structure.",
            "temperature": 0.7,
            "max_tokens": 2000
          }
        },
        {
          "id": "create_doc",
          "type": "docs_api",
          "action": "create_document",
          "config": {
            "title": "{{config.doc_title}}",
            "content": "{{ai_generate_content.output}}"
          }
        },
        {
          "id": "share_doc",
          "type": "drive_api",
          "action": "share",
          "config": {
            "file_id": "{{create_doc.id}}",
            "role": "writer",
            "type": "user",
            "email_address": "{{user.email}}"
          }
        }
      ],
      "outputs": [
        {
          "type": "document",
          "destination": "google_docs"
        }
      ]
    }',
    ARRAY['google'],
    'gpt-4',
    true,
    false
  ),
  (
    '00000000-0000-0000-0000-000000000005',
    'Sheet Analyzer',
    'Analyze Google Sheets data and generate insights',
    'gsuite',
    '{
      "trigger": {
        "type": "manual",
        "config": {
          "description": "Manually triggered with spreadsheet selection"
        }
      },
      "steps": [
        {
          "id": "fetch_data",
          "type": "sheets_api",
          "action": "get_values",
          "config": {
            "spreadsheet_id": "{{config.spreadsheet_id}}",
            "range": "{{config.sheet_range}}"
          }
        },
        {
          "id": "ai_analyze",
          "type": "ai_model",
          "action": "analyze",
          "config": {
            "system_prompt": "Analyze the provided spreadsheet data. Identify trends, outliers, key insights, and provide actionable recommendations.",
            "temperature": 0.4,
            "max_tokens": 1500
          }
        },
        {
          "id": "create_report",
          "type": "docs_api",
          "action": "create_document",
          "config": {
            "title": "Data Analysis Report - {{current_date}}",
            "content": "{{ai_analyze.output}}"
          }
        }
      ],
      "outputs": [
        {
          "type": "document",
          "destination": "google_docs"
        }
      ]
    }',
    ARRAY['google'],
    'claude-3-opus-20240229',
    true,
    false
  );

-- Slack Automations
INSERT INTO public.automation_templates (id, name, description, category, template_data, required_credentials, default_model, is_active, is_featured)
VALUES
  (
    '00000000-0000-0000-0000-000000000006',
    'Channel Summarizer',
    'Generate daily digest of Slack channel activity',
    'slack',
    '{
      "trigger": {
        "type": "schedule",
        "config": {
          "cron": "0 18 * * *",
          "timezone": "UTC",
          "description": "Daily at 6:00 PM"
        }
      },
      "steps": [
        {
          "id": "fetch_messages",
          "type": "slack_api",
          "action": "conversations_history",
          "config": {
            "channel": "{{config.channel_id}}",
            "oldest": "{{now - 24h}}",
            "limit": 100
          }
        },
        {
          "id": "ai_summarize",
          "type": "ai_model",
          "action": "summarize",
          "config": {
            "system_prompt": "Summarize the Slack channel activity. Include key discussions, decisions, action items, and important mentions.",
            "temperature": 0.3,
            "max_tokens": 1000
          }
        },
        {
          "id": "post_summary",
          "type": "slack_api",
          "action": "chat_postMessage",
          "config": {
            "channel": "{{config.channel_id}}",
            "text": "Daily Summary",
            "blocks": [
              {
                "type": "section",
                "text": {
                  "type": "mrkdwn",
                  "text": "{{ai_summarize.output}}"
                }
              }
            ]
          }
        }
      ],
      "outputs": [
        {
          "type": "message",
          "destination": "slack"
        }
      ]
    }',
    ARRAY['slack'],
    'claude-3-haiku-20240307',
    true,
    true
  ),
  (
    '00000000-0000-0000-0000-000000000007',
    'Customer Email Responder',
    'Draft responses to customer emails in Slack',
    'slack',
    '{
      "trigger": {
        "type": "webhook",
        "config": {
          "event": "slack.message.channels",
          "description": "Triggered when message posted in channel"
        }
      },
      "steps": [
        {
          "id": "detect_email",
          "type": "condition",
          "config": {
            "field": "message.text",
            "operator": "contains",
            "value": "@email"
          }
        },
        {
          "id": "ai_draft_response",
          "type": "ai_model",
          "action": "generate",
          "config": {
            "system_prompt": "Draft a professional, empathetic email response to the customer inquiry. Maintain a helpful and friendly tone.",
            "temperature": 0.6,
            "max_tokens": 500
          }
        },
        {
          "id": "post_draft",
          "type": "slack_api",
          "action": "chat_postMessage",
          "config": {
            "channel": "{{event.channel}}",
            "thread_ts": "{{event.ts}}",
            "text": "Draft Response",
            "blocks": [
              {
                "type": "section",
                "text": {
                  "type": "mrkdwn",
                  "text": "{{ai_draft_response.output}}"
                }
              }
            ]
          }
        }
      ],
      "outputs": [
        {
          "type": "message",
          "destination": "slack"
        }
      ]
    }',
    ARRAY['slack'],
    'gpt-4',
    true,
    false
  ),
  (
    '00000000-0000-0000-0000-000000000008',
    'Mention Alerter',
    'AI-summarized mention notifications',
    'slack',
    '{
      "trigger": {
        "type": "webhook",
        "config": {
          "event": "slack.message.im",
          "description": "Triggered on direct mentions"
        }
      },
      "steps": [
        {
          "id": "fetch_context",
          "type": "slack_api",
          "action": "conversations_replies",
          "config": {
            "channel": "{{event.channel}}",
            "ts": "{{event.thread_ts}}",
            "limit": 10
          }
        },
        {
          "id": "ai_summarize",
          "type": "ai_model",
          "action": "summarize",
          "config": {
            "system_prompt": "Summarize this Slack conversation where you were mentioned. Extract the key point, any questions directed at you, and suggested actions.",
            "temperature": 0.3,
            "max_tokens": 300
          }
        },
        {
          "id": "send_dm",
          "type": "slack_api",
          "action": "chat_postMessage",
          "config": {
            "channel": "{{user.slack_id}}",
            "text": "You were mentioned",
            "blocks": [
              {
                "type": "section",
                "text": {
                  "type": "mrkdwn",
                  "text": "{{ai_summarize.output}}"
                }
              },
              {
                "type": "actions",
                "elements": [
                  {
                    "type": "button",
                    "text": {
                      "type": "plain_text",
                      "text": "View Thread"
                    },
                    "url": "{{event.permalink}}"
                  }
                ]
              }
            ]
          }
        }
      ],
      "outputs": [
        {
          "type": "notification",
          "destination": "slack_dm"
        }
      ]
    }',
    ARRAY['slack'],
    'gpt-4o-mini',
    true,
    false
  );

-- Jira Automations
INSERT INTO public.automation_templates (id, name, description, category, template_data, required_credentials, default_model, is_active, is_featured)
VALUES
  (
    '00000000-0000-0000-0000-000000000009',
    'Ticket Prioritizer',
    'AI-prioritize new Jira tickets based on content',
    'jira',
    '{
      "trigger": {
        "type": "webhook",
        "config": {
          "event": "jira:issue_created",
          "description": "Triggered when new issue created"
        }
      },
      "steps": [
        {
          "id": "ai_analyze",
          "type": "ai_model",
          "action": "classify",
          "config": {
            "system_prompt": "Analyze this Jira ticket and assign priority (Critical, High, Medium, Low) based on urgency, impact, and business value. Provide reasoning.",
            "temperature": 0.2,
            "max_tokens": 200
          }
        },
        {
          "id": "update_priority",
          "type": "jira_api",
          "action": "update_issue",
          "config": {
            "issue_id": "{{event.issue.id}}",
            "fields": {
              "priority": {
                "name": "{{ai_analyze.priority}}"
              }
            }
          }
        },
        {
          "id": "add_comment",
          "type": "jira_api",
          "action": "add_comment",
          "config": {
            "issue_id": "{{event.issue.id}}",
            "body": "AI Priority Analysis: {{ai_analyze.reasoning}}"
          }
        }
      ],
      "outputs": [
        {
          "type": "ticket_update",
          "destination": "jira"
        }
      ]
    }',
    ARRAY['jira'],
    'claude-3-sonnet-20240229',
    true,
    true
  ),
  (
    '00000000-0000-0000-0000-000000000010',
    'Sprint Reporter',
    'Generate sprint summary reports',
    'jira',
    '{
      "trigger": {
        "type": "manual",
        "config": {
          "description": "Manually triggered at sprint end"
        }
      },
      "steps": [
        {
          "id": "fetch_sprint_issues",
          "type": "jira_api",
          "action": "search_issues",
          "config": {
            "jql": "sprint = {{config.sprint_id}} ORDER BY status",
            "max_results": 100,
            "fields": ["summary", "status", "assignee", "priority"]
          }
        },
        {
          "id": "ai_generate_report",
          "type": "ai_model",
          "action": "generate",
          "config": {
            "system_prompt": "Generate a comprehensive sprint report including: completion rate, highlights, challenges, team performance, and recommendations for next sprint.",
            "temperature": 0.5,
            "max_tokens": 1500
          }
        },
        {
          "id": "create_confluence_page",
          "type": "confluence_api",
          "action": "create_page",
          "config": {
            "space": "{{config.confluence_space}}",
            "title": "Sprint {{config.sprint_id}} Report",
            "content": "{{ai_generate_report.output}}"
          }
        }
      ],
      "outputs": [
        {
          "type": "document",
          "destination": "confluence"
        }
      ]
    }',
    ARRAY['jira'],
    'claude-3-opus-20240229',
    true,
    false
  ),
  (
    '00000000-0000-0000-0000-000000000011',
    'Bug Analyzer',
    'Analyze bug patterns and generate insights',
    'jira',
    '{
      "trigger": {
        "type": "schedule",
        "config": {
          "cron": "0 10 * * MON",
          "timezone": "UTC",
          "description": "Weekly on Monday at 10:00 AM"
        }
      },
      "steps": [
        {
          "id": "fetch_bugs",
          "type": "jira_api",
          "action": "search_issues",
          "config": {
            "jql": "type = Bug AND created >= -7d ORDER BY created DESC",
            "max_results": 100,
            "fields": ["summary", "description", "labels", "components"]
          }
        },
        {
          "id": "ai_analyze_patterns",
          "type": "ai_model",
          "action": "analyze",
          "config": {
            "system_prompt": "Analyze these bug reports for patterns. Identify: recurring issues, affected components, root causes, and preventive measures.",
            "temperature": 0.4,
            "max_tokens": 1000
          }
        },
        {
          "id": "create_report_issue",
          "type": "jira_api",
          "action": "create_issue",
          "config": {
            "project": "{{config.project_key}}",
            "issue_type": "Task",
            "summary": "Weekly Bug Analysis Report - {{current_date}}",
            "description": "{{ai_analyze_patterns.output}}",
            "labels": ["bug-analysis", "weekly-report"]
          }
        }
      ],
      "outputs": [
        {
          "type": "ticket",
          "destination": "jira"
        }
      ]
    }',
    ARRAY['jira'],
    'gpt-4',
    true,
    false
  );

-- Google Chat Automations
INSERT INTO public.automation_templates (id, name, description, category, template_data, required_credentials, default_model, is_active, is_featured)
VALUES
  (
    '00000000-0000-0000-0000-000000000012',
    'Space Responder',
    'Draft responses to Google Chat space messages',
    'chat',
    '{
      "trigger": {
        "type": "webhook",
        "config": {
          "event": "google.chat.message",
          "description": "Triggered on space messages"
        }
      },
      "steps": [
        {
          "id": "fetch_thread",
          "type": "chat_api",
          "action": "get_thread",
          "config": {
            "space": "{{event.space.name}}",
            "thread": "{{event.message.thread.name}}"
          }
        },
        {
          "id": "ai_draft",
          "type": "ai_model",
          "action": "generate",
          "config": {
            "system_prompt": "Draft a helpful, professional response to this Google Chat message. Consider the full thread context.",
            "temperature": 0.6,
            "max_tokens": 400
          }
        },
        {
          "id": "post_response",
          "type": "chat_api",
          "action": "create_message",
          "config": {
            "space": "{{event.space.name}}",
            "thread": "{{event.message.thread.name}}",
            "text": "{{ai_draft.output}}"
          }
        }
      ],
      "outputs": [
        {
          "type": "message",
          "destination": "google_chat"
        }
      ]
    }',
    ARRAY['google'],
    'gpt-4',
    true,
    false
  ),
  (
    '00000000-0000-0000-0000-000000000013',
    'Meeting Scheduler',
    'AI-assisted meeting scheduling via Google Chat',
    'chat',
    '{
      "trigger": {
        "type": "webhook",
        "config": {
          "event": "google.chat.message",
          "description": "Triggered on direct messages"
        }
      },
      "steps": [
        {
          "id": "detect_schedule_intent",
          "type": "ai_model",
          "action": "classify",
          "config": {
            "system_prompt": "Determine if this message is a meeting scheduling request. Extract: participants, duration, preferred times, and meeting purpose.",
            "temperature": 0.2,
            "max_tokens": 300
          }
        },
        {
          "id": "find_availability",
          "type": "calendar_api",
          "action": "freebusy",
          "config": {
            "time_min": "{{now}}",
            "time_max": "{{now + 7d}}",
            "items": "{{ai_extract.participants}}"
          },
          "condition": "{{detect_schedule_intent.is_scheduling_request}}"
        },
        {
          "id": "ai_suggest_times",
          "type": "ai_model",
          "action": "generate",
          "config": {
            "system_prompt": "Based on availability, suggest 3 optimal meeting times with reasoning.",
            "temperature": 0.4,
            "max_tokens": 300
          }
        },
        {
          "id": "send_suggestions",
          "type": "chat_api",
          "action": "create_message",
          "config": {
            "space": "{{event.space.name}}",
            "text": "{{ai_suggest_times.output}}"
          }
        }
      ],
      "outputs": [
        {
          "type": "message",
          "destination": "google_chat"
        }
      ]
    }',
    ARRAY['google'],
    'claude-3-sonnet-20240229',
    true,
    true
  );

-- Update the created_at timestamps to be more realistic
UPDATE public.automation_templates
SET created_at = NOW() - (random() * interval '30 days')
WHERE id LIKE '00000000-0000-0000-0000-%';

-- ============================================================================
-- NOTES
-- ============================================================================
--
-- These templates are admin-maintained and visible to all employees.
-- Each template includes:
--   - name: Display name
--   - description: What the automation does
--   - category: gsuite, slack, jira, chat, custom
--   - template_data: Complete workflow structure (trigger, steps, outputs)
--   - required_credentials: Integration types needed (google, slack, jira, n8n)
--   - default_model: Suggested AI model for this workflow
--   - is_active: Whether visible to employees
--   - is_featured: Highlighted in UI
--
-- Template data structure:
--   - trigger: How automation starts (schedule, webhook, manual)
--   - steps: Array of workflow steps with types:
--       - api calls (gmail_api, slack_api, jira_api, etc.)
--       - ai_model (summarize, generate, classify, analyze)
--       - condition (filtering logic)
--   - outputs: Expected results (email, document, message, etc.)
--
-- ============================================================================
