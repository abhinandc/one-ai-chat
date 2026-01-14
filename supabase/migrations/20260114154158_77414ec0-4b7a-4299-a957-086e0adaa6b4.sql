
-- Insert templates with proper syntax
INSERT INTO public.workflow_templates (name, description, category, natural_language_example, trigger_channel_slug, action_channel_slug, department_id, complexity, estimated_time, required_integrations, steps, is_featured) 
SELECT 'Model Deployment Alert', 'Notify team when a new AI model is deployed', 'notifications', 'When a model is deployed, notify the AI team', 'webhook', 'google-chat', d.id, 'simple', '2 min', ARRAY['google-chat'], '[{"type": "trigger", "name": "Model Deployed"}, {"type": "action", "name": "Send Notification"}]'::jsonb, true
FROM public.departments d WHERE d.slug = 'oneai-office' AND NOT EXISTS (SELECT 1 FROM public.workflow_templates WHERE name = 'Model Deployment Alert');

INSERT INTO public.workflow_templates (name, description, category, natural_language_example, trigger_channel_slug, action_channel_slug, department_id, complexity, estimated_time, required_integrations, steps, is_featured) 
SELECT 'CI Pipeline Alert', 'Alert when pipeline fails', 'devops', 'When CI fails, notify developers', 'webhook', 'google-chat', d.id, 'medium', '3 min', ARRAY['google-chat'], '[{"type": "trigger", "name": "Pipeline Failed"}, {"type": "action", "name": "Send Alert"}]'::jsonb, true
FROM public.departments d WHERE d.slug = 'oneplatform' AND NOT EXISTS (SELECT 1 FROM public.workflow_templates WHERE name = 'CI Pipeline Alert');

INSERT INTO public.workflow_templates (name, description, category, natural_language_example, trigger_channel_slug, action_channel_slug, department_id, complexity, estimated_time, required_integrations, steps, is_featured) 
SELECT 'Access Request Flow', 'Automate access approvals', 'access-control', 'When access requested, notify manager', 'webhook', 'gmail', d.id, 'medium', '5 min', ARRAY['gmail'], '[{"type": "trigger", "name": "Access Requested"}, {"type": "action", "name": "Notify Manager"}]'::jsonb, true
FROM public.departments d WHERE d.slug = 'onesecurity' AND NOT EXISTS (SELECT 1 FROM public.workflow_templates WHERE name = 'Access Request Flow');

INSERT INTO public.workflow_templates (name, description, category, natural_language_example, trigger_channel_slug, action_channel_slug, department_id, complexity, estimated_time, required_integrations, steps, is_featured) 
SELECT 'Cost Anomaly Alert', 'Alert on cost spikes', 'cost-management', 'When costs spike, alert finance', 'schedule', 'gmail', d.id, 'medium', '5 min', ARRAY['gmail'], '[{"type": "trigger", "name": "Daily Check"}, {"type": "action", "name": "Send Alert"}]'::jsonb, true
FROM public.departments d WHERE d.slug = 'oneinfra' AND NOT EXISTS (SELECT 1 FROM public.workflow_templates WHERE name = 'Cost Anomaly Alert');

INSERT INTO public.workflow_templates (name, description, category, natural_language_example, trigger_channel_slug, action_channel_slug, department_id, complexity, estimated_time, required_integrations, steps, is_featured) 
SELECT 'Sprint Summary', 'Auto-generate sprint summaries', 'delivery', 'At sprint end, email summary', 'schedule', 'gmail', d.id, 'medium', '5 min', ARRAY['gmail'], '[{"type": "trigger", "name": "Sprint End"}, {"type": "action", "name": "Email Summary"}]'::jsonb, true
FROM public.departments d WHERE d.slug = 'onevalue' AND NOT EXISTS (SELECT 1 FROM public.workflow_templates WHERE name = 'Sprint Summary');

INSERT INTO public.workflow_templates (name, description, category, natural_language_example, trigger_channel_slug, action_channel_slug, department_id, complexity, estimated_time, required_integrations, steps, is_featured) 
SELECT 'Lead Scoring', 'AI-powered lead scoring', 'sales', 'When lead arrives, score and route', 'webhook', 'gmail', d.id, 'complex', '10 min', ARRAY['gmail'], '[{"type": "trigger", "name": "New Lead"}, {"type": "action", "name": "AI Score"}, {"type": "action", "name": "Route"}]'::jsonb, true
FROM public.departments d WHERE d.slug = 'onerev' AND NOT EXISTS (SELECT 1 FROM public.workflow_templates WHERE name = 'Lead Scoring');
