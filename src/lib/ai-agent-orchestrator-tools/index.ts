/**
 * AI Agent Orchestrator Tools
 *
 * A comprehensive toolkit for orchestrating AI agents in a multi-worker pattern.
 * Based on the cult-ui Pro AI Chat Agent Orchestrator Pattern.
 *
 * Tools:
 * - orchestratorTool: Plans and coordinates complex tasks
 * - workerTool: Executes specialized tasks assigned by the orchestrator
 * - coordinatorTool: Manages orchestration lifecycle and resolves blockers
 */

export { orchestratorTool, type OrchestratorUIToolInvocation } from "./orchestrator";
export { workerTool, type WorkerUIToolInvocation } from "./worker";
export { coordinatorTool, type CoordinatorUIToolInvocation } from "./coordinator";

export {
  ImplementationItemSchema,
  WorkerTaskSchema,
  WorkerResultSchema,
  OrchestrationSummarySchema,
} from "./schema";

// Re-export types for convenience
export type { z } from "zod";
