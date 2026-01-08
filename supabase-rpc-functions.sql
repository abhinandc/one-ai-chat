-- RPC Functions for OneEdge UI Application

-- Function to increment prompt likes
CREATE OR REPLACE FUNCTION increment_prompt_likes(prompt_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE prompt_templates 
  SET likes_count = likes_count + 1,
      updated_at = now()
  WHERE id = prompt_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decrement prompt likes
CREATE OR REPLACE FUNCTION decrement_prompt_likes(prompt_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE prompt_templates 
  SET likes_count = GREATEST(likes_count - 1, 0),
      updated_at = now()
  WHERE id = prompt_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment prompt uses
CREATE OR REPLACE FUNCTION increment_prompt_uses(prompt_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE prompt_templates 
  SET uses_count = uses_count + 1,
      updated_at = now()
  WHERE id = prompt_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update automation statistics
CREATE OR REPLACE FUNCTION update_automation_stats(automation_id uuid, success boolean)
RETURNS void AS $$
DECLARE
  current_runs integer;
  current_rate numeric;
  successful_runs numeric;
BEGIN
  SELECT total_runs, success_rate INTO current_runs, current_rate
  FROM automations WHERE id = automation_id;
  
  IF current_runs IS NOT NULL THEN
    successful_runs := (current_rate * current_runs / 100.0);
    IF success THEN
      successful_runs := successful_runs + 1;
    END IF;
    
    UPDATE automations 
    SET total_runs = current_runs + 1,
        success_rate = (successful_runs / (current_runs + 1)) * 100,
        last_run_at = now(),
        updated_at = now()
    WHERE id = automation_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user usage metrics
CREATE OR REPLACE FUNCTION get_user_usage_metrics(p_user_email text)
RETURNS json AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'user_email', p_user_email,
    'total_requests', COALESCE(SUM(CASE WHEN timestamp >= CURRENT_DATE - INTERVAL '30 days' THEN 1 ELSE 0 END), 0),
    'total_tokens', COALESCE(SUM(CASE WHEN timestamp >= CURRENT_DATE - INTERVAL '30 days' THEN tokens_used ELSE 0 END), 0),
    'total_cost', COALESCE(SUM(CASE WHEN timestamp >= CURRENT_DATE - INTERVAL '30 days' THEN cost_usd ELSE 0 END), 0),
    'requests_today', COALESCE(SUM(CASE WHEN DATE(timestamp) = CURRENT_DATE THEN 1 ELSE 0 END), 0),
    'tokens_today', COALESCE(SUM(CASE WHEN DATE(timestamp) = CURRENT_DATE THEN tokens_used ELSE 0 END), 0),
    'cost_today', COALESCE(SUM(CASE WHEN DATE(timestamp) = CURRENT_DATE THEN cost_usd ELSE 0 END), 0)
  ) INTO result
  FROM api_usage_logs 
  WHERE user_email = p_user_email;
  
  RETURN COALESCE(result, json_build_object(
    'user_email', p_user_email,
    'total_requests', 0,
    'total_tokens', 0,
    'total_cost', 0,
    'requests_today', 0,
    'tokens_today', 0,
    'cost_today', 0
  ));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get dashboard statistics
CREATE OR REPLACE FUNCTION get_dashboard_stats(p_user_email text)
RETURNS json AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'total_conversations', (
      SELECT COUNT(*) FROM conversations WHERE user_email = p_user_email
    ),
    'total_automations', (
      SELECT COUNT(*) FROM automations WHERE user_email = p_user_email
    ),
    'total_prompts', (
      SELECT COUNT(*) FROM prompt_templates WHERE user_email = p_user_email
    ),
    'total_agents', (
      SELECT COUNT(*) FROM agent_workflows WHERE user_email = p_user_email
    ),
    'requests_today', (
      SELECT COUNT(*) FROM api_usage_logs 
      WHERE user_email = p_user_email 
        AND DATE(timestamp) = CURRENT_DATE
    ),
    'cost_today', (
      SELECT COALESCE(SUM(cost_usd), 0) FROM api_usage_logs 
      WHERE user_email = p_user_email 
        AND DATE(timestamp) = CURRENT_DATE
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable real-time subscriptions (run after tables are created)
-- ALTER publication supabase_realtime ADD TABLE conversations;
-- ALTER publication supabase_realtime ADD TABLE prompt_templates;
-- ALTER publication supabase_realtime ADD TABLE automations;
-- ALTER publication supabase_realtime ADD TABLE automation_executions;
-- ALTER publication supabase_realtime ADD TABLE activity_events;
