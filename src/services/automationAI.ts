/**
 * AI-powered automation parsing service
 * Parses natural language automation descriptions into structured workflow data
 */

import { apiClient } from './api';

export interface ParsedAutomation {
  name: string;
  description: string;
  trigger: {
    type: 'email' | 'schedule' | 'webhook' | 'slack_message' | 'calendar' | 'manual';
    channel_slug: string | null;
    config: Record<string, any>;
  };
  conditions: {
    field: string;
    operator: 'contains' | 'equals' | 'not_equals' | 'greater_than' | 'less_than';
    value: string;
  }[];
  aiProcessing: {
    enabled: boolean;
    task: 'analyze' | 'summarize' | 'classify' | 'generate' | 'extract' | null;
    prompt: string | null;
  };
  action: {
    type: 'send_email' | 'send_slack' | 'create_task' | 'update_record' | 'notify' | 'webhook';
    channel_slug: string | null;
    config: Record<string, any>;
  };
  confidence: number;
}

const AUTOMATION_PARSER_PROMPT = `You are an automation workflow parser. Given a natural language description of an automation, extract the structured workflow components.

Analyze the user's description and return a JSON object with:
1. name: A short descriptive name for the automation
2. description: A clear description of what the automation does
3. trigger: What starts the automation (email received, schedule, slack message, etc.)
4. conditions: Any filtering conditions mentioned (from VIP client, high priority, etc.)
5. aiProcessing: Whether AI analysis is needed and what type (analyze, summarize, classify, generate, extract)
6. action: What should happen (send notification, draft email, create task, etc.)
7. confidence: Your confidence in the parsing accuracy (0-1)

Channel slugs should be: gmail, slack, jira, notion, calendar, sheets, github, webhook, manual

Respond ONLY with valid JSON, no markdown code blocks or explanation.`;

/**
 * Parse a natural language automation description using AI
 */
export async function parseAutomationWithAI(
  naturalLanguage: string,
  model: string = 'chatgpt-4o-latest'
): Promise<{ parsed: ParsedAutomation | null; error: string | null }> {
  try {
    const response = await apiClient.createChatCompletion({
      model,
      messages: [
        { role: 'system', content: AUTOMATION_PARSER_PROMPT },
        { role: 'user', content: `Parse this automation: "${naturalLanguage}"` }
      ],
      temperature: 0.2,
      max_tokens: 1000,
    });

    const content = response.choices?.[0]?.message?.content;
    if (!content) {
      return { parsed: null, error: 'No response from AI' };
    }

    // Parse the JSON response
    const parsed = JSON.parse(content.trim()) as ParsedAutomation;

    return { parsed, error: null };
  } catch (err) {
    console.error('[AutomationAI] Parse error:', err);
    return {
      parsed: null,
      error: err instanceof Error ? err.message : 'Failed to parse automation'
    };
  }
}

/**
 * Map channel slug to integration channel ID
 */
export function mapChannelSlugToId(
  slug: string | null,
  channels: { id: string; slug: string }[]
): string | null {
  if (!slug) return null;
  const channel = channels.find(c => c.slug === slug);
  return channel?.id || null;
}

/**
 * Generate a human-readable summary of the parsed automation
 */
export function generateAutomationSummary(parsed: ParsedAutomation): string {
  const parts: string[] = [];

  // Trigger
  const triggerMap: Record<string, string> = {
    email: 'When an email is received',
    schedule: 'On a schedule',
    webhook: 'When a webhook is triggered',
    slack_message: 'When a Slack message is received',
    calendar: 'When a calendar event occurs',
    manual: 'When manually triggered',
  };
  parts.push(triggerMap[parsed.trigger.type] || 'When triggered');

  // Conditions
  if (parsed.conditions.length > 0) {
    const conditionTexts = parsed.conditions.map(c =>
      `${c.field} ${c.operator.replace('_', ' ')} "${c.value}"`
    );
    parts.push(`if ${conditionTexts.join(' and ')}`);
  }

  // AI Processing
  if (parsed.aiProcessing.enabled && parsed.aiProcessing.task) {
    const taskMap: Record<string, string> = {
      analyze: 'analyze the content',
      summarize: 'summarize the content',
      classify: 'classify the content',
      generate: 'generate a response',
      extract: 'extract information',
    };
    parts.push(`then ${taskMap[parsed.aiProcessing.task] || 'process with AI'}`);
  }

  // Action
  const actionMap: Record<string, string> = {
    send_email: 'and send an email',
    send_slack: 'and send a Slack notification',
    create_task: 'and create a task',
    update_record: 'and update a record',
    notify: 'and send a notification',
    webhook: 'and call a webhook',
  };
  parts.push(actionMap[parsed.action.type] || 'and take action');

  return parts.join(', ');
}

/**
 * Validate that required integrations are connected
 */
export function validateAutomationRequirements(
  parsed: ParsedAutomation,
  connectedChannelSlugs: Set<string>
): { valid: boolean; missingChannels: string[] } {
  const requiredChannels: string[] = [];

  if (parsed.trigger.channel_slug) {
    requiredChannels.push(parsed.trigger.channel_slug);
  }
  if (parsed.action.channel_slug) {
    requiredChannels.push(parsed.action.channel_slug);
  }

  const missingChannels = requiredChannels.filter(
    slug => !connectedChannelSlugs.has(slug)
  );

  return {
    valid: missingChannels.length === 0,
    missingChannels,
  };
}
