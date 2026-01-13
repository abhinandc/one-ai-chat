/**
 * Process Automation Edge Function
 *
 * Handles execution of user automations. Processes triggers, runs AI steps,
 * and executes actions like sending emails, posting messages, etc.
 *
 * Endpoints:
 * - POST /execute - Execute an automation
 * - POST /trigger - Trigger an automation via webhook
 * - POST /test - Test run an automation without side effects
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders, handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts';
import { supabaseAdmin, getUserFromAuth } from '../_shared/supabase.ts';
import { decrypt } from '../_shared/crypto.ts';

type AutomationStatus = 'pending' | 'running' | 'success' | 'failed';

interface AutomationTrigger {
  type: 'schedule' | 'webhook' | 'email' | 'event' | 'manual';
  config: Record<string, unknown>;
}

interface AutomationStep {
  id: string;
  type: 'ai_process' | 'send_email' | 'post_message' | 'create_doc' | 'api_call' | 'conditional';
  name: string;
  config: Record<string, unknown>;
}

interface AutomationTemplateData {
  trigger: AutomationTrigger;
  steps: AutomationStep[];
  variables: Array<{
    name: string;
    type: 'string' | 'number' | 'boolean' | 'object';
    required: boolean;
    default?: unknown;
    description?: string;
  }>;
}

interface ExecuteRequest {
  action: 'execute';
  automation_id: string;
  input_data?: Record<string, unknown>;
}

interface TriggerRequest {
  action: 'trigger';
  automation_id: string;
  trigger_data?: Record<string, unknown>;
}

interface TestRequest {
  action: 'test';
  automation_id: string;
  input_data?: Record<string, unknown>;
}

type RequestBody = ExecuteRequest | TriggerRequest | TestRequest;

/**
 * Execute an AI processing step.
 * Calls the configured AI model with the provided prompt and context.
 */
async function executeAIStep(
  step: AutomationStep,
  context: Record<string, unknown>,
  userEmail: string
): Promise<{ success: boolean; result?: unknown; error?: string }> {
  try {
    const config = step.config as {
      prompt: string;
      model?: string;
      systemPrompt?: string;
      temperature?: number;
    };

    // Replace variables in the prompt
    let prompt = config.prompt || '';
    for (const [key, value] of Object.entries(context)) {
      prompt = prompt.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
    }

    // Get user's virtual key to determine available models
    const { data: virtualKey } = await supabaseAdmin
      .from('virtual_keys')
      .select('*')
      .eq('email', userEmail)
      .eq('disabled', false)
      .single();

    if (!virtualKey) {
      return { success: false, error: 'No active virtual key found' };
    }

    // For now, we'll simulate the AI call
    // In production, this would call the actual AI API via the proxy
    const aiResult = {
      content: `[AI Response for: ${prompt.substring(0, 100)}...]`,
      model: config.model || 'gpt-4',
      tokens_used: 150,
    };

    return { success: true, result: aiResult };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'AI processing failed';
    return { success: false, error: message };
  }
}

/**
 * Execute an email sending step.
 */
async function executeEmailStep(
  step: AutomationStep,
  context: Record<string, unknown>,
  userId: string
): Promise<{ success: boolean; result?: unknown; error?: string }> {
  try {
    const config = step.config as {
      to: string;
      subject: string;
      body: string;
      credentialId?: string;
    };

    // Replace variables in email fields
    let to = config.to || '';
    let subject = config.subject || '';
    let body = config.body || '';

    for (const [key, value] of Object.entries(context)) {
      to = to.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
      subject = subject.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
      body = body.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
    }

    // If a credential is specified, get it
    if (config.credentialId) {
      const { data: credential } = await supabaseAdmin
        .from('edge_vault_credentials')
        .select('*')
        .eq('id', config.credentialId)
        .eq('user_id', userId)
        .single();

      if (!credential) {
        return { success: false, error: 'Email credential not found' };
      }

      // Decrypt and use the credential
      // In production, this would use the actual email API
    }

    // For now, simulate email sending
    console.log(`Would send email to: ${to}, subject: ${subject}`);

    return {
      success: true,
      result: {
        to,
        subject,
        sent_at: new Date().toISOString(),
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Email sending failed';
    return { success: false, error: message };
  }
}

/**
 * Execute a Slack message posting step.
 */
async function executeSlackStep(
  step: AutomationStep,
  context: Record<string, unknown>,
  userId: string
): Promise<{ success: boolean; result?: unknown; error?: string }> {
  try {
    const config = step.config as {
      channel: string;
      message: string;
      credentialId: string;
    };

    // Get the Slack credential
    const { data: credential } = await supabaseAdmin
      .from('edge_vault_credentials')
      .select('*')
      .eq('id', config.credentialId)
      .eq('user_id', userId)
      .eq('integration_type', 'slack')
      .single();

    if (!credential) {
      return { success: false, error: 'Slack credential not found' };
    }

    // Decrypt the credential
    const decryptedCreds = JSON.parse(await decrypt(credential.encrypted_credentials));
    const token = decryptedCreds.token;

    if (!token) {
      return { success: false, error: 'Slack token not found in credentials' };
    }

    // Replace variables in message
    let message = config.message || '';
    for (const [key, value] of Object.entries(context)) {
      message = message.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
    }

    // Post to Slack
    const response = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        channel: config.channel,
        text: message,
      }),
    });

    const result = await response.json();

    if (result.ok) {
      return {
        success: true,
        result: {
          channel: config.channel,
          ts: result.ts,
          posted_at: new Date().toISOString(),
        },
      };
    }

    return { success: false, error: result.error || 'Slack API error' };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Slack posting failed';
    return { success: false, error: message };
  }
}

/**
 * Execute an API call step.
 */
async function executeApiCallStep(
  step: AutomationStep,
  context: Record<string, unknown>
): Promise<{ success: boolean; result?: unknown; error?: string }> {
  try {
    const config = step.config as {
      url: string;
      method: string;
      headers?: Record<string, string>;
      body?: string;
    };

    // Replace variables in URL and body
    let url = config.url || '';
    let body = config.body || '';

    for (const [key, value] of Object.entries(context)) {
      url = url.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
      body = body.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
    }

    const response = await fetch(url, {
      method: config.method || 'GET',
      headers: config.headers,
      body: config.method !== 'GET' && body ? body : undefined,
    });

    const responseData = await response.json().catch(() => response.text());

    return {
      success: response.ok,
      result: {
        status: response.status,
        data: responseData,
      },
      error: response.ok ? undefined : `HTTP ${response.status}`,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'API call failed';
    return { success: false, error: message };
  }
}

/**
 * Execute a conditional step.
 * Returns which branch to take based on the condition.
 */
function executeConditionalStep(
  step: AutomationStep,
  context: Record<string, unknown>
): { success: boolean; result?: unknown; error?: string } {
  try {
    const config = step.config as {
      condition: string;
      trueBranch: string;
      falseBranch: string;
    };

    // Simple condition evaluation
    // In production, this would use a proper expression parser
    let condition = config.condition || 'false';
    for (const [key, value] of Object.entries(context)) {
      condition = condition.replace(new RegExp(`{{${key}}}`, 'g'), JSON.stringify(value));
    }

    // Evaluate the condition (safely)
    let result = false;
    try {
      // Very basic evaluation - in production use a proper sandbox
      result = condition === 'true' || condition === '"true"';
    } catch {
      result = false;
    }

    return {
      success: true,
      result: {
        condition_met: result,
        next_step: result ? config.trueBranch : config.falseBranch,
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Condition evaluation failed';
    return { success: false, error: message };
  }
}

/**
 * Execute a single automation step.
 */
async function executeStep(
  step: AutomationStep,
  context: Record<string, unknown>,
  userId: string,
  userEmail: string,
  isDryRun: boolean
): Promise<{ success: boolean; result?: unknown; error?: string }> {
  console.log(`Executing step: ${step.name} (${step.type})`);

  if (isDryRun) {
    return {
      success: true,
      result: { dry_run: true, step_type: step.type, step_name: step.name },
    };
  }

  switch (step.type) {
    case 'ai_process':
      return executeAIStep(step, context, userEmail);
    case 'send_email':
      return executeEmailStep(step, context, userId);
    case 'post_message':
      return executeSlackStep(step, context, userId);
    case 'api_call':
      return executeApiCallStep(step, context);
    case 'conditional':
      return executeConditionalStep(step, context);
    case 'create_doc':
      // Placeholder for Google Docs creation
      return {
        success: true,
        result: { dry_run: true, message: 'Document creation not yet implemented' },
      };
    default:
      return { success: false, error: `Unknown step type: ${step.type}` };
  }
}

/**
 * Execute an entire automation.
 */
async function executeAutomation(
  automationId: string,
  userId: string,
  userEmail: string,
  inputData: Record<string, unknown>,
  isDryRun: boolean
): Promise<{
  success: boolean;
  execution_id?: string;
  results?: Array<{ step: string; success: boolean; result?: unknown; error?: string }>;
  error?: string;
}> {
  // Get the automation
  const { data: automation, error: fetchError } = await supabaseAdmin
    .from('automations')
    .select('*')
    .eq('id', automationId)
    .eq('user_email', userEmail)
    .single();

  if (fetchError || !automation) {
    return { success: false, error: 'Automation not found' };
  }

  // If automation uses a template, get the template data
  let config: AutomationTemplateData | null = null;

  // Try to parse the automation config or get from template
  // In the current schema, automations reference an agent_id
  // For now, we'll create a simple config structure
  config = {
    trigger: { type: 'manual', config: {} },
    steps: [],
    variables: [],
  };

  // Create execution record
  const startTime = new Date();
  const { data: execution, error: execError } = await supabaseAdmin
    .from('automation_executions')
    .insert({
      automation_id: automationId,
      user_email: userEmail,
      status: 'running',
      started_at: startTime.toISOString(),
      input_data: inputData,
    })
    .select()
    .single();

  if (execError) {
    return { success: false, error: 'Failed to create execution record' };
  }

  // Build context from input data and variables
  const context: Record<string, unknown> = {
    ...inputData,
  };

  // Apply variable defaults
  for (const variable of config.variables) {
    if (context[variable.name] === undefined && variable.default !== undefined) {
      context[variable.name] = variable.default;
    }
  }

  // Execute steps
  const stepResults: Array<{ step: string; success: boolean; result?: unknown; error?: string }> = [];
  let overallSuccess = true;

  for (const step of config.steps) {
    const result = await executeStep(step, context, userId, userEmail, isDryRun);
    stepResults.push({
      step: step.name,
      success: result.success,
      result: result.result,
      error: result.error,
    });

    // Update context with step result
    context[`step_${step.id}_result`] = result.result;

    if (!result.success) {
      overallSuccess = false;
      break; // Stop on first failure
    }
  }

  // Update execution record
  const endTime = new Date();
  const duration = endTime.getTime() - startTime.getTime();

  await supabaseAdmin
    .from('automation_executions')
    .update({
      status: overallSuccess ? 'success' : 'failed',
      completed_at: endTime.toISOString(),
      output_data: { steps: stepResults },
      error_message: overallSuccess ? null : stepResults.find(r => !r.success)?.error,
    })
    .eq('id', execution.id);

  // Update automation stats
  await supabaseAdmin
    .from('automations')
    .update({
      last_run_at: endTime.toISOString(),
      total_runs: (automation.total_runs || 0) + 1,
    })
    .eq('id', automationId);

  return {
    success: overallSuccess,
    execution_id: execution.id,
    results: stepResults,
  };
}

serve(async (req) => {
  // Handle CORS preflight
  const cors = handleCors(req);
  if (cors) return cors;

  // Only allow POST
  if (req.method !== 'POST') {
    return errorResponse('Method not allowed', 405);
  }

  try {
    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    const user = await getUserFromAuth(authHeader);
    if (!user) {
      return errorResponse('Unauthorized', 401);
    }

    const body: RequestBody = await req.json();

    switch (body.action) {
      case 'execute': {
        const result = await executeAutomation(
          body.automation_id,
          user.id,
          user.email,
          body.input_data || {},
          false
        );
        return jsonResponse(result);
      }

      case 'trigger': {
        // Webhook trigger - similar to execute but with trigger data
        const result = await executeAutomation(
          body.automation_id,
          user.id,
          user.email,
          body.trigger_data || {},
          false
        );
        return jsonResponse(result);
      }

      case 'test': {
        // Dry run - executes logic but doesn't perform side effects
        const result = await executeAutomation(
          body.automation_id,
          user.id,
          user.email,
          body.input_data || {},
          true
        );
        return jsonResponse({
          ...result,
          is_test: true,
        });
      }

      default:
        return errorResponse('Invalid action', 400);
    }
  } catch (error) {
    console.error('Process automation error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return errorResponse(message, 500);
  }
});
