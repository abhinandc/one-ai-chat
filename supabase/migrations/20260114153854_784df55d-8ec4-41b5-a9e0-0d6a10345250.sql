
-- Create departments table
CREATE TABLE IF NOT EXISTS public.departments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  color TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Departments are viewable by everyone" 
ON public.departments FOR SELECT USING (true);

-- Insert the 6 departments
INSERT INTO public.departments (name, slug, description, icon, color, sort_order) VALUES
('OneAI Office', 'oneai-office', 'In-house products, agents, models, innovation, internal automation', 'Brain', 'hsl(280, 80%, 60%)', 1),
('OnePlatform', 'oneplatform', 'Core product engineering standards, shared frameworks, developer velocity, CI/CD, integrations', 'Layers', 'hsl(220, 80%, 60%)', 2),
('OneSecurity', 'onesecurity', 'Security engineering, access control, auditability, compliance posture, incident readiness', 'Shield', 'hsl(0, 80%, 60%)', 3),
('OneInfra', 'oneinfra', 'Compute/cluster, networking, storage/NAS, model serving runtime, observability, reliability, cost/perf', 'Server', 'hsl(160, 80%, 45%)', 4),
('OneValue', 'onevalue', 'Value-based services delivery (Eng/PM/QA), outcome execution, delivery automation', 'TrendingUp', 'hsl(45, 90%, 55%)', 5),
('OneRev', 'onerev', 'Enterprise GTM: sales + marketing + brand + pricing/proposals/deal desk, AI-driven pipeline', 'Rocket', 'hsl(340, 80%, 60%)', 6)
ON CONFLICT (slug) DO NOTHING;

-- Add columns to automation_rules if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'automation_rules' AND column_name = 'department_id') THEN
    ALTER TABLE public.automation_rules ADD COLUMN department_id UUID REFERENCES public.departments(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'automation_rules' AND column_name = 'priority') THEN
    ALTER TABLE public.automation_rules ADD COLUMN priority TEXT DEFAULT 'medium';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'automation_rules' AND column_name = 'approval_required') THEN
    ALTER TABLE public.automation_rules ADD COLUMN approval_required BOOLEAN DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'automation_rules' AND column_name = 'approvers') THEN
    ALTER TABLE public.automation_rules ADD COLUMN approvers TEXT[] DEFAULT '{}';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'automation_rules' AND column_name = 'schedule_cron') THEN
    ALTER TABLE public.automation_rules ADD COLUMN schedule_cron TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'automation_rules' AND column_name = 'conditions') THEN
    ALTER TABLE public.automation_rules ADD COLUMN conditions JSONB DEFAULT '[]';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'automation_rules' AND column_name = 'actions') THEN
    ALTER TABLE public.automation_rules ADD COLUMN actions JSONB DEFAULT '[]';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'automation_rules' AND column_name = 'variables') THEN
    ALTER TABLE public.automation_rules ADD COLUMN variables JSONB DEFAULT '{}';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'automation_rules' AND column_name = 'run_count') THEN
    ALTER TABLE public.automation_rules ADD COLUMN run_count INTEGER DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'automation_rules' AND column_name = 'last_run_status') THEN
    ALTER TABLE public.automation_rules ADD COLUMN last_run_status TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'automation_rules' AND column_name = 'last_run_at') THEN
    ALTER TABLE public.automation_rules ADD COLUMN last_run_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Add columns to workflow_templates if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workflow_templates' AND column_name = 'department_id') THEN
    ALTER TABLE public.workflow_templates ADD COLUMN department_id UUID REFERENCES public.departments(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workflow_templates' AND column_name = 'complexity') THEN
    ALTER TABLE public.workflow_templates ADD COLUMN complexity TEXT DEFAULT 'simple';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workflow_templates' AND column_name = 'estimated_time') THEN
    ALTER TABLE public.workflow_templates ADD COLUMN estimated_time TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workflow_templates' AND column_name = 'required_integrations') THEN
    ALTER TABLE public.workflow_templates ADD COLUMN required_integrations TEXT[] DEFAULT '{}';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workflow_templates' AND column_name = 'steps') THEN
    ALTER TABLE public.workflow_templates ADD COLUMN steps JSONB DEFAULT '[]';
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_automation_rules_department ON public.automation_rules(department_id);
CREATE INDEX IF NOT EXISTS idx_workflow_templates_department ON public.workflow_templates(department_id);
