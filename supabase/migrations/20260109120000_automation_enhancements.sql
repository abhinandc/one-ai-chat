-- ============================================================================
-- Automation Enhancements Migration
-- Created: 2026-01-09
-- Description: Add missing columns to automations table for full functionality
-- ============================================================================

-- Add trigger_config column to store trigger configuration
ALTER TABLE public.automations
ADD COLUMN IF NOT EXISTS trigger_config JSONB NOT NULL DEFAULT '{"type": "manual", "config": {}}'::jsonb;

-- Add credential_id to link automation to EdgeVault credential
ALTER TABLE public.automations
ADD COLUMN IF NOT EXISTS credential_id UUID REFERENCES public.edge_vault_credentials(id) ON DELETE SET NULL;

-- Add model column to specify which AI model to use
ALTER TABLE public.automations
ADD COLUMN IF NOT EXISTS model TEXT;

-- Add template_id to track which template was used (if any)
ALTER TABLE public.automations
ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES public.automation_templates(id) ON DELETE SET NULL;

-- Add updated_at column
ALTER TABLE public.automations
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Create trigger for updated_at
CREATE TRIGGER set_updated_at_automations
  BEFORE UPDATE ON public.automations
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

-- Create index for faster credential lookups
CREATE INDEX IF NOT EXISTS idx_automations_credential_id ON public.automations(credential_id);
CREATE INDEX IF NOT EXISTS idx_automations_template_id ON public.automations(template_id);
CREATE INDEX IF NOT EXISTS idx_automations_user_email ON public.automations(user_email);

-- Add RPC function to update automation stats
CREATE OR REPLACE FUNCTION public.update_automation_stats(
  automation_id UUID,
  success BOOLEAN
)
RETURNS VOID AS $$
DECLARE
  current_total_runs INTEGER;
  current_success_rate NUMERIC;
  successful_runs INTEGER;
BEGIN
  -- Get current stats
  SELECT total_runs, success_rate INTO current_total_runs, current_success_rate
  FROM public.automations
  WHERE id = automation_id;

  -- Calculate new stats
  IF current_total_runs IS NULL THEN
    current_total_runs := 0;
  END IF;

  IF current_success_rate IS NULL THEN
    current_success_rate := 100;
  END IF;

  -- Calculate successful runs from current stats
  successful_runs := FLOOR((current_total_runs * current_success_rate) / 100);

  -- Increment total runs
  current_total_runs := current_total_runs + 1;

  -- Update successful runs
  IF success THEN
    successful_runs := successful_runs + 1;
  END IF;

  -- Calculate new success rate
  current_success_rate := (successful_runs::NUMERIC / current_total_runs::NUMERIC) * 100;

  -- Update automation
  UPDATE public.automations
  SET
    total_runs = current_total_runs,
    success_rate = ROUND(current_success_rate, 2),
    last_run_at = NOW()
  WHERE id = automation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execution on the function
GRANT EXECUTE ON FUNCTION public.update_automation_stats(UUID, BOOLEAN) TO authenticated;

-- Add comments
COMMENT ON COLUMN public.automations.trigger_config IS 'Trigger configuration (schedule, webhook, manual, event)';
COMMENT ON COLUMN public.automations.credential_id IS 'EdgeVault credential to use for this automation';
COMMENT ON COLUMN public.automations.model IS 'AI model to use for this automation';
COMMENT ON COLUMN public.automations.template_id IS 'Template this automation was created from (if any)';
