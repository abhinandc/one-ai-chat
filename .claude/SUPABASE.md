# OneEdge Supabase Configuration

## Production Supabase Instance

**IMPORTANT**: This is the REAL Supabase instance for OneEdge. NO MOCKS!

### Credentials

```
Project Reference: vzrnxiowtshzspybrxeq
URL: https://vzrnxiowtshzspybrxeq.supabase.co
Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6cm54aW93dHNoenNweWJyeGVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2ODY0NDEsImV4cCI6MjA3NDI2MjQ0MX0.CpSZhCBJYkrCGqsqVd5Qm8TKrQBBE0l8l0hN_iMLVbc
Service Role Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6cm54aW93dHNoenNweWJyeGVxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODY4NjQ0MSwiZXhwIjoyMDc0MjYyNDQxfQ.ChfQig1ChX3FGCqyT_aQEt-9dthDh7kSSWhpwn_mJgM
```

### Testing Guidelines

1. **NO MOCKS** - All tests MUST use real Supabase connection
2. **NO SKIP** - If tables don't exist, create them via migration
3. Tests use `user_email` field for test data isolation
4. Test emails: `test-vitest@oneedge.test`, `test-vitest-conv@oneedge.test`
5. Clean up test data in afterAll hooks

### Existing Tables

- conversations
- conversation_folders
- chat_messages
- prompt_templates
- prompt_likes
- prompt_usage
- automations
- automation_executions
- automation_logs
- user_preferences
- app_users
- usage_events
- activity_feed
- usage_summary
- playground_sessions
- model_admin_settings
- mcp_servers
- mcp_server_tools
- tool_installations

### Tables to Create (from migration)

- user_roles
- agents
- edge_vault_credentials
- automation_templates
- prompt_feeds
- external_prompts
- ai_gallery_requests
- n8n_configurations
- projects
- sia_memory
