import { tool } from "ai";
import { z } from "zod";

/**
 * Coordinator Tool - Manages orchestration lifecycle and resolves blockers
 *
 * This tool coordinates between the orchestrator and workers,
 * tracking progress and handling issues that arise during execution.
 */
export const coordinatorTool = tool({
  description:
    "Coordinate orchestration lifecycle, track progress, and resolve blockers",
  parameters: z.object({
    action: z
      .enum(["start", "check_progress", "resolve_blocker", "complete", "pause", "resume"])
      .describe("The coordination action to perform"),
    orchestrationId: z
      .string()
      .describe("Unique identifier for the orchestration session"),
    context: z
      .string()
      .optional()
      .describe("Additional context for the action"),
    blockerId: z
      .string()
      .optional()
      .describe("ID of the blocker to resolve (for resolve_blocker action)"),
    resolution: z
      .string()
      .optional()
      .describe("Resolution strategy for the blocker"),
  }),
  execute: async ({ action, orchestrationId, context, blockerId, resolution }) => {
    const actionResults: Record<string, {
      status: "success" | "in_progress" | "blocked" | "completed" | "paused";
      message: string;
      data?: Record<string, unknown>;
    }> = {
      start: {
        status: "in_progress",
        message: `Orchestration ${orchestrationId} started successfully`,
        data: {
          startedAt: new Date().toISOString(),
          initialContext: context || "No additional context provided",
          estimatedTasks: 6,
        },
      },
      check_progress: {
        status: "in_progress",
        message: `Progress check for orchestration ${orchestrationId}`,
        data: {
          completedTasks: 2,
          totalTasks: 6,
          currentPhase: "development",
          progressPercentage: 33,
          activeWorkers: ["frontend", "backend"],
          pendingTasks: ["testing", "deployment", "documentation"],
          blockers: [],
        },
      },
      resolve_blocker: {
        status: "success",
        message: `Blocker ${blockerId || "unknown"} resolved with strategy: ${resolution || "default"}`,
        data: {
          resolvedAt: new Date().toISOString(),
          blockerId: blockerId || "unknown",
          resolution: resolution || "Applied default resolution strategy",
          impactedTasks: [],
        },
      },
      complete: {
        status: "completed",
        message: `Orchestration ${orchestrationId} completed successfully`,
        data: {
          completedAt: new Date().toISOString(),
          totalDuration: "2h 45m",
          tasksCompleted: 6,
          deliverables: [
            "Requirements analysis document",
            "System architecture diagrams",
            "Working application",
            "Test suite with 85% coverage",
            "Production deployment",
            "User documentation",
          ],
          qualityScore: 92,
        },
      },
      pause: {
        status: "paused",
        message: `Orchestration ${orchestrationId} paused`,
        data: {
          pausedAt: new Date().toISOString(),
          reason: context || "User requested pause",
          canResume: true,
          savedState: {
            completedTasks: 3,
            pendingTasks: 3,
            activeWorkers: [],
          },
        },
      },
      resume: {
        status: "in_progress",
        message: `Orchestration ${orchestrationId} resumed`,
        data: {
          resumedAt: new Date().toISOString(),
          previousState: "paused",
          resumingFrom: "task-4",
          remainingTasks: 3,
        },
      },
    };

    const result = actionResults[action] || {
      status: "success" as const,
      message: `Unknown action ${action} processed`,
      data: {},
    };

    return {
      state: "ready" as const,
      result: {
        orchestrationId,
        action,
        ...result,
      },
    };
  },
});

export type CoordinatorUIToolInvocation = {
  state:
    | "loading"
    | "ready"
    | "input-streaming"
    | "input-available"
    | "output-available"
    | "output-error";
  input?: {
    action: "start" | "check_progress" | "resolve_blocker" | "complete" | "pause" | "resume";
    orchestrationId: string;
    context?: string;
    blockerId?: string;
    resolution?: string;
  };
  output?: {
    state: "loading" | "ready";
    result?: {
      orchestrationId: string;
      action: string;
      status: "success" | "in_progress" | "blocked" | "completed" | "paused";
      message: string;
      data?: {
        startedAt?: string;
        completedAt?: string;
        pausedAt?: string;
        resumedAt?: string;
        resolvedAt?: string;
        completedTasks?: number;
        totalTasks?: number;
        currentPhase?: string;
        progressPercentage?: number;
        activeWorkers?: string[];
        pendingTasks?: string[];
        blockers?: string[];
        deliverables?: string[];
        qualityScore?: number;
        totalDuration?: string;
        canResume?: boolean;
        savedState?: Record<string, unknown>;
        remainingTasks?: number;
        resumingFrom?: string;
        previousState?: string;
        blockerId?: string;
        resolution?: string;
        impactedTasks?: string[];
        initialContext?: string;
        estimatedTasks?: number;
        reason?: string;
      };
    };
  };
  errorText?: string;
};
