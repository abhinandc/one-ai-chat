# OneAI Gateway - Master Documentation

## Overview

The OneAI Gateway is a unified API gateway that provides:
- Single endpoint for all AI models in the cluster
- API key authentication
- Automatic fallback between models
- Model registry backed by Supabase
- Usage logging and health tracking

| Property | Value |
|----------|-------|
| **Location** | NAS (10.0.0.153) |
| **Container** | oneai-gateway |
| **Internal Port** | 3100 |
| **External URL** | https://api-oneai.oneorigin.us |
| **Source Code** | /volume1/projects/oneai-gateway/ |
| **Supabase** | https://qglkefffrvkjnfwyeqrr.supabase.co |

---

## API Keys

| Key Name | Key Value | Use Case |
|----------|-----------|----------|
| ADMIN | `oo-370b956bc3d0666f8cf89b288d1bd6ce07734ca1779a0df77f9b665bd6fa233d` | Admin operations |
| N8N | `oo-61660ec777bcbdae824a18ac7dd3d1db65a4860c7ccefecb44ad3165f309fc66` | n8n automations |
| DEV | `oo-8182635d0032d89ed68fe080bcc349b376db3bb681bcf782473e5c67fc8b0413` | Development/testing |

---

## Endpoints

### Health Check
```bash
GET /health
# No authentication required

curl https://api-oneai.oneorigin.us/health
```

Response:
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "uptime_seconds": 3600,
  "models_registered": 5,
  "routes_registered": 0
}
```

### List Models
```bash
GET /models
# Requires API key

curl -s https://api-oneai.oneorigin.us/models \
  -H "X-API-Key: oo-370b956bc3d0666f8cf89b288d1bd6ce07734ca1779a0df77f9b665bd6fa233d"
```

Response:
```json
{
  "models": [
    {
      "code": "op1",
      "name": "DeepSeek-OCR",
      "description": "DeepSeek OCR - Primary",
      "domain": "ocr",
      "role": "primary",
      "provider": "deepseek",
      "active": true,
      "fallback": "op2"
    }
  ]
}
```

### Get Single Model
```bash
GET /models/:id
# Requires API key

curl -s https://api-oneai.oneorigin.us/models/op1 \
  -H "X-API-Key: YOUR_API_KEY"
```

### Run Inference
```bash
POST /v1/run
# Requires API key

curl -X POST https://api-oneai.oneorigin.us/v1/run \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{
    "task": "ocr",
    "profile": "default",
    "model": "op1",
    "input": {
      "image": "base64-encoded-image"
    }
  }'
```

---

## Current Models

| Code | Name | Provider | Port | Fallback | Description |
|------|------|----------|------|----------|-------------|
| op1 | DeepSeek-OCR | deepseek | 8000 | op2 | Primary OCR |
| op2 | GOT-OCR-2 | got-ocr | 8001 | op3 | General OCR |
| op3 | olmOCR-2-7B | olmocr | 8002 | op4 | Qwen2.5-VL based |
| op4 | PaddleOCR-VL | paddle | 8003 | op5 | Document understanding |
| op5 | MinerU-2.5 | mineru | 8004 | null | Fast lightweight |

---

## Model Naming Convention

```
<domain><role><index>

Domain:
  o = OCR
  l = LLM
  v = Vision
  t = Tools
  e = Embed
  r = Rerank

Role:
  p = primary
  b = backup
  s = small/fast
  v = validation

Examples:
  op1 = OCR primary 1
  lb1 = LLM backup 1
  es1 = Embed small 1
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Cloudflare Tunnel                         │
│                 api-oneai.oneorigin.us                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      NAS (10.0.0.153)                        │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              OneAI Gateway (:3100)                   │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────────────────┐ │    │
│  │  │   Auth   │ │  Router  │ │   Supabase Client    │ │    │
│  │  │Middleware│ │          │ │  (models, routing)   │ │    │
│  │  └──────────┘ └──────────┘ └──────────────────────┘ │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Spark (10.0.0.135)                        │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐        │
│  │  :8000   │ │  :8001   │ │  :8002   │ │  :8003   │  ...   │
│  │DeepSeek  │ │ GOT-OCR  │ │ olmOCR   │ │ Paddle   │        │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘        │
└─────────────────────────────────────────────────────────────┘
```

---

## Configuration

### Environment Variables (master.env)

```bash
# ───────────────────────────────────────────────────────────────
# SERVER
# ───────────────────────────────────────────────────────────────
PORT=3100
HOST=0.0.0.0
NODE_ENV=production

# ───────────────────────────────────────────────────────────────
# AUTHENTICATION
# ───────────────────────────────────────────────────────────────
API_KEY_ENABLED=true
API_KEY_HEADER=X-API-Key
API_KEYS=oo-370b956bc3d0666f8cf89b288d1bd6ce07734ca1779a0df77f9b665bd6fa233d,oo-61660ec777bcbdae824a18ac7dd3d1db65a4860c7ccefecb44ad3165f309fc66,oo-8182635d0032d89ed68fe080bcc349b376db3bb681bcf782473e5c67fc8b0413

# ───────────────────────────────────────────────────────────────
# SUPABASE
# ───────────────────────────────────────────────────────────────
SUPABASE_URL=https://qglkefffrvkjnfwyeqrr.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFnbGtlZmZmcnZram5md3llcXJyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTYxMTY4OCwiZXhwIjoyMDc3MTg3Njg4fQ.YiJ1JW0wAVPgDwgf3h4StnnlpCB51Sx9nXmsi8q1APQ

# ───────────────────────────────────────────────────────────────
# MODELS (loaded from Supabase, but can override here)
# ───────────────────────────────────────────────────────────────
MODEL_OP1_ENDPOINT=http://10.0.0.135:8000/v1/chat/completions
MODEL_OP1_TIMEOUT=120000
MODEL_OP1_FALLBACK=op2
MODEL_OP1_MAX_TOKENS=8192

MODEL_OP2_ENDPOINT=http://10.0.0.135:8001/v1/chat/completions
MODEL_OP2_TIMEOUT=120000
MODEL_OP2_FALLBACK=op3
MODEL_OP2_MAX_TOKENS=8192

# ... etc
```

---

## Supabase Schema

### models table

```sql
CREATE TABLE public.models (
  model_code text NOT NULL PRIMARY KEY,
  domain text NOT NULL,           -- ocr, llm, vision, embed, rerank
  role text NOT NULL,             -- primary, backup, small
  provider text NOT NULL,         -- deepseek, openai, anthropic, etc.
  endpoint text NOT NULL,         -- http://10.0.0.135:8000/v1/chat/completions
  timeout_ms integer DEFAULT 60000,
  max_tokens integer DEFAULT 4096,
  active boolean DEFAULT true,
  fallback_model_code text REFERENCES models(model_code),
  meta jsonb DEFAULT '{}',        -- {name, description, ...}
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

### model_health table

```sql
CREATE TABLE public.model_health (
  model_code text PRIMARY KEY REFERENCES models(model_code),
  status text DEFAULT 'healthy',  -- healthy, degraded, unhealthy
  failure_count integer DEFAULT 0,
  success_count integer DEFAULT 0,
  consecutive_failures integer DEFAULT 0,
  last_failure_at timestamptz,
  last_success_at timestamptz,
  last_error_message text,
  circuit_state text DEFAULT 'closed',  -- closed, half_open, open
  circuit_opened_at timestamptz,
  avg_latency_ms integer,
  p95_latency_ms integer,
  updated_at timestamptz DEFAULT now()
);
```

### model_usage_log table

```sql
CREATE TABLE public.model_usage_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid,
  doc_id text,
  model_code text NOT NULL REFERENCES models(model_code),
  task text NOT NULL,
  wf_run_id uuid,
  tokens_in integer,
  tokens_out integer,
  latency_ms integer,
  cost_usd numeric,
  success boolean DEFAULT true,
  error_class text,
  created_at timestamptz DEFAULT now()
);
```

---

## Source Code Structure

```
/volume1/projects/oneai-gateway/
├── docker-compose.yml
├── Dockerfile
├── master.env
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts              # Entry point
│   ├── server.ts             # Fastify server setup
│   ├── routes/
│   │   ├── health.ts         # GET /health
│   │   ├── run.ts            # POST /v1/run
│   │   └── models.ts         # GET /models (reads from Supabase)
│   ├── middleware/
│   │   └── auth.ts           # API key validation
│   ├── services/
│   │   ├── registry.ts       # Model registry
│   │   ├── router.ts         # Task → Model routing
│   │   ├── executor.ts       # Model execution
│   │   ├── fallback.ts       # Fallback handling
│   │   └── prompts.ts        # Prompt templates
│   └── utils/
│       ├── logger.ts
│       ├── errors.ts
│       └── api.ts
└── dist/                     # Compiled JavaScript
```

---

## Common Commands

### Gateway Management

```bash
# SSH to NAS
ssh root@10.0.0.153

# Navigate to gateway
cd /volume1/projects/oneai-gateway

# Check status
docker ps | grep oneai-gateway

# View logs
docker logs oneai-gateway --tail 100 -f

# Restart
docker compose restart

# Rebuild and restart
docker compose down
docker compose up -d --build

# Full rebuild (no cache)
docker compose down
docker compose build --no-cache
docker compose up -d
```

### Testing

```bash
# Health check
curl -s https://api-oneai.oneorigin.us/health

# List models
curl -s https://api-oneai.oneorigin.us/models \
  -H "X-API-Key: oo-370b956bc3d0666f8cf89b288d1bd6ce07734ca1779a0df77f9b665bd6fa233d"

# Test OCR
curl -X POST https://api-oneai.oneorigin.us/v1/run \
  -H "Content-Type: application/json" \
  -H "X-API-Key: oo-370b956bc3d0666f8cf89b288d1bd6ce07734ca1779a0df77f9b665bd6fa233d" \
  -d '{
    "task": "ocr",
    "profile": "default",
    "input": {"text": "test"}
  }'
```

---

## Using in n8n

### Setup Credential

1. Go to **Credentials** → **Add Credential** → **Header Auth**
2. Name: `OneAI Gateway`
3. Header Name: `X-API-Key`
4. Header Value: `oo-61660ec777bcbdae824a18ac7dd3d1db65a4860c7ccefecb44ad3165f309fc66`

### HTTP Request Node

```
Method: POST
URL: https://api-oneai.oneorigin.us/v1/run
Authentication: Header Auth → OneAI Gateway
Headers:
  Content-Type: application/json

Body (JSON):
{
  "task": "ocr",
  "profile": "transcript",
  "model": "op1",
  "input": {
    "image": "{{ $binary.data.toBase64() }}"
  }
}
```

---

# Adding New Models - Step by Step Guide

## For Claude Code / AI Assistants

When asked to add a new model, follow these steps:

### Step 1: Deploy the Model on Spark (or other GPU node)

```bash
# SSH to Spark
ssh abhinandc@10.0.0.135

# Create model directory
mkdir -p /mnt/nas/models/<domain>/<model-name>
cd /mnt/nas/models/<domain>/<model-name>

# Create docker-compose.yml
cat > docker-compose.yml << 'EOF'
version: '3.8'
services:
  <model-name>:
    image: <image>:<tag>
    container_name: <model-name>-api
    ports:
      - "<PORT>:8000"
    volumes:
      - ./weights:/app/models
    environment:
      - CUDA_VISIBLE_DEVICES=0
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
    restart: unless-stopped
EOF

# Start the model
docker compose up -d

# Verify it's running
curl http://localhost:<PORT>/health
```

### Step 2: Determine Model Code

Use the naming convention:
```
<domain><role><index>

Domains: o=OCR, l=LLM, v=Vision, t=Tools, e=Embed, r=Rerank
Roles: p=primary, b=backup, s=small, v=validation

Example: New LLM primary → lp1
Example: New embedding small → es1
```

Check existing codes:
```bash
curl -s "https://qglkefffrvkjnfwyeqrr.supabase.co/rest/v1/models?select=model_code" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFnbGtlZmZmcnZram5md3llcXJyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTYxMTY4OCwiZXhwIjoyMDc3MTg3Njg4fQ.YiJ1JW0wAVPgDwgf3h4StnnlpCB51Sx9nXmsi8q1APQ" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFnbGtlZmZmcnZram5md3llcXJyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTYxMTY4OCwiZXhwIjoyMDc3MTg3Njg4fQ.YiJ1JW0wAVPgDwgf3h4StnnlpCB51Sx9nXmsi8q1APQ"
```

### Step 3: Add to Supabase

```bash
# Insert new model
curl -s "https://qglkefffrvkjnfwyeqrr.supabase.co/rest/v1/models" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFnbGtlZmZmcnZram5md3llcXJyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTYxMTY4OCwiZXhwIjoyMDc3MTg3Njg4fQ.YiJ1JW0wAVPgDwgf3h4StnnlpCB51Sx9nXmsi8q1APQ" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFnbGtlZmZmcnZram5md3llcXJyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTYxMTY4OCwiZXhwIjoyMDc3MTg3Njg4fQ.YiJ1JW0wAVPgDwgf3h4StnnlpCB51Sx9nXmsi8q1APQ" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{
    "model_code": "<MODEL_CODE>",
    "domain": "<DOMAIN>",
    "role": "<ROLE>",
    "provider": "<PROVIDER>",
    "endpoint": "http://10.0.0.135:<PORT>/v1/chat/completions",
    "timeout_ms": 120000,
    "max_tokens": 8192,
    "active": true,
    "meta": {
      "name": "<Friendly Name>",
      "description": "<Description>"
    }
  }'
```

### Step 4: Set Fallback Chain (Optional)

```bash
# Update existing model to fallback to new one
curl -s "https://qglkefffrvkjnfwyeqrr.supabase.co/rest/v1/models?model_code=eq.<EXISTING_CODE>" \
  -X PATCH \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFnbGtlZmZmcnZram5md3llcXJyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTYxMTY4OCwiZXhwIjoyMDc3MTg3Njg4fQ.YiJ1JW0wAVPgDwgf3h4StnnlpCB51Sx9nXmsi8q1APQ" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFnbGtlZmZmcnZram5md3llcXJyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTYxMTY4OCwiZXhwIjoyMDc3MTg3Njg4fQ.YiJ1JW0wAVPgDwgf3h4StnnlpCB51Sx9nXmsi8q1APQ" \
  -H "Content-Type: application/json" \
  -d '{"fallback_model_code": "<NEW_MODEL_CODE>"}'
```

### Step 5: Verify

```bash
# Check model appears in gateway
curl -s https://api-oneai.oneorigin.us/models \
  -H "X-API-Key: oo-370b956bc3d0666f8cf89b288d1bd6ce07734ca1779a0df77f9b665bd6fa233d" | jq '.models[] | select(.code == "<MODEL_CODE>")'

# Test the model directly
curl -X POST https://api-oneai.oneorigin.us/v1/run \
  -H "Content-Type: application/json" \
  -H "X-API-Key: oo-370b956bc3d0666f8cf89b288d1bd6ce07734ca1779a0df77f9b665bd6fa233d" \
  -d '{
    "task": "<DOMAIN>",
    "model": "<MODEL_CODE>",
    "input": {"text": "test"}
  }'
```

---

## Example: Adding a New LLM Model

Let's say you want to add Llama 3.1 70B as a new LLM:

### 1. Deploy on Spark

```bash
ssh abhinandc@10.0.0.135

mkdir -p /mnt/nas/models/llm/llama-3.1-70b
cd /mnt/nas/models/llm/llama-3.1-70b

cat > docker-compose.yml << 'EOF'
version: '3.8'
services:
  llama-31-70b:
    image: vllm/vllm-openai:latest
    container_name: llama-31-70b-api
    ports:
      - "8100:8000"
    volumes:
      - /mnt/nas/models/llm/llama-3.1-70b/weights:/root/.cache/huggingface
    environment:
      - CUDA_VISIBLE_DEVICES=0,1
    command: ["--model", "meta-llama/Llama-3.1-70B-Instruct", "--tensor-parallel-size", "2"]
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 2
              capabilities: [gpu]
    restart: unless-stopped
EOF

docker compose up -d
```

### 2. Add to Supabase

```bash
curl -s "https://qglkefffrvkjnfwyeqrr.supabase.co/rest/v1/models" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFnbGtlZmZmcnZram5md3llcXJyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTYxMTY4OCwiZXhwIjoyMDc3MTg3Njg4fQ.YiJ1JW0wAVPgDwgf3h4StnnlpCB51Sx9nXmsi8q1APQ" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFnbGtlZmZmcnZram5md3llcXJyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTYxMTY4OCwiZXhwIjoyMDc3MTg3Njg4fQ.YiJ1JW0wAVPgDwgf3h4StnnlpCB51Sx9nXmsi8q1APQ" \
  -H "Content-Type: application/json" \
  -d '{
    "model_code": "lp1",
    "domain": "llm",
    "role": "primary",
    "provider": "meta",
    "endpoint": "http://10.0.0.135:8100/v1/chat/completions",
    "timeout_ms": 180000,
    "max_tokens": 4096,
    "active": true,
    "meta": {
      "name": "Llama-3.1-70B",
      "description": "Meta Llama 3.1 70B Instruct"
    }
  }'
```

### 3. Test

```bash
curl -X POST https://api-oneai.oneorigin.us/v1/run \
  -H "Content-Type: application/json" \
  -H "X-API-Key: oo-370b956bc3d0666f8cf89b288d1bd6ce07734ca1779a0df77f9b665bd6fa233d" \
  -d '{
    "task": "llm",
    "model": "lp1",
    "input": {"messages": [{"role": "user", "content": "Hello!"}]}
  }'
```

---

## Troubleshooting

### Model not showing in /models

1. Check Supabase:
```bash
curl -s "https://qglkefffrvkjnfwyeqrr.supabase.co/rest/v1/models?model_code=eq.<CODE>" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFnbGtlZmZmcnZram5md3llcXJyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTYxMTY4OCwiZXhwIjoyMDc3MTg3Njg4fQ.YiJ1JW0wAVPgDwgf3h4StnnlpCB51Sx9nXmsi8q1APQ" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFnbGtlZmZmcnZram5md3llcXJyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTYxMTY4OCwiZXhwIjoyMDc3MTg3Njg4fQ.YiJ1JW0wAVPgDwgf3h4StnnlpCB51Sx9nXmsi8q1APQ"
```

2. Check if `active=true`

3. Check gateway logs:
```bash
docker logs oneai-gateway --tail 100
```

### Model returns errors

1. Test model directly:
```bash
curl http://10.0.0.135:<PORT>/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model": "test", "messages": [{"role": "user", "content": "test"}]}'
```

2. Check model container logs:
```bash
ssh abhinandc@10.0.0.135 "docker logs <container-name> --tail 100"
```

### Gateway timeout

1. Increase timeout in Supabase:
```bash
curl -s "https://qglkefffrvkjnfwyeqrr.supabase.co/rest/v1/models?model_code=eq.<CODE>" \
  -X PATCH \
  -H "apikey: ..." \
  -H "Authorization: Bearer ..." \
  -H "Content-Type: application/json" \
  -d '{"timeout_ms": 300000}'
```

---

## Quick Reference

### Supabase Credentials

| Property | Value |
|----------|-------|
| URL | https://qglkefffrvkjnfwyeqrr.supabase.co |
| Anon Key | eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFnbGtlZmZmcnZram5md3llcXJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2MTE2ODgsImV4cCI6MjA3NzE4NzY4OH0.764vCV3xmgJ6I_SDi2H-GWy4fieO7gE4RBaV5gYTfss |
| Service Key | eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFnbGtlZmZmcnZram5md3llcXJyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTYxMTY4OCwiZXhwIjoyMDc3MTg3Njg4fQ.YiJ1JW0wAVPgDwgf3h4StnnlpCB51Sx9nXmsi8q1APQ |

### Server IPs

| Server | IP | SSH |
|--------|-----|-----|
| NAS | 10.0.0.153 | ssh root@10.0.0.153 |
| Spark | 10.0.0.135 | ssh abhinandc@10.0.0.135 |
| Hetzner | 5.161.180.191 | ssh root@5.161.180.191 |

### Used Ports on Spark

| Port | Model |
|------|-------|
| 8000 | DeepSeek-OCR (op1) |
| 8001 | GOT-OCR-2 (op2) |
| 8002 | olmOCR-2-7B (op3) |
| 8003 | PaddleOCR-VL (op4) |
| 8004 | MinerU-2.5 (op5) |
| 8100+ | Available for new models |
