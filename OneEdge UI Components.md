### OneEdge UI Components

1. Dialog boxes - npx shadcn@latest add @animate-ui/components-radix-dialog
2. Sidebar - npx shadcn@latest add @animate-ui/components-radix-sidebar
3. Automation canvas background - npx shadcn@latest add https://chamaac.com/r/interactive-grid-background.json

## Cult tools - use token, configuration and api key
4. **AI tool use mode** - chat page where tools are used to process documents or research - npx shadcn@beta add @cult-ui-pro/ai-chat-agent-orchestrater-pattern; add configuration {
  "registries": {
    "@cult-ui-pro": {
      "url": "https://pro.cult-ui.com/api/registry/{name}",
      "headers": {
        "X-API-Key": "${CULT_PRO_TOKEN}"
      }
    }
  }
}
CULT_PRO_TOKEN=cult_GAsrdidv5kqDDFjgReINXY0C1Nuzyiu3 - put it in .env
API key - cult_GAsrdidv5kqDDFjgReINXY0C1Nuzyiu3

5. Chat page - AI table articulation - npx shadcn@beta add @cult-ui-pro/ai-artifact-table
6. Chat page - thinking deep and tool usage - npx shadcn@beta add @cult-ui-pro/ai-chat-agent-multi-step-tool-pattern

## Other components
7. Spinner - https://www.shadcnblocks.com/components/spinner
8. Overall Chat modal component - npx ai-elements@latest
9. Code block - npx ai-elements@latest add code-block
10. Terminal - npx ai-elements@latest add terminal
11. Loaders for chat page - npx shadcn add "https://prompt-kit.com/c/loader.json"
123. Chat page - AI chain of thought for thinking mode - npx shadcn add "https://prompt-kit.com/c/chain-of-thought.json"
