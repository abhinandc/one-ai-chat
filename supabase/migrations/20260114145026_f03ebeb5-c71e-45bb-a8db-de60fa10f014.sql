-- Add unique constraint for upsert on models table
ALTER TABLE models ADD CONSTRAINT models_name_provider_unique UNIQUE (name, provider);

-- Add api_path column to provider_config if missing (for dynamic path templates)
-- The api_path in models table can use {model} placeholder that gets replaced