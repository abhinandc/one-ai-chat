import { tool } from "ai";
import { z } from "zod";

/**
 * Orchestrator Tool - Plans and coordinates complex tasks
 *
 * This tool acts as the central coordinator that breaks down complex requests
 * into manageable tasks and assigns them to specialized workers.
 */
export const orchestratorTool = tool({
  description:
    "Plan and coordinate complex tasks by breaking them down into manageable subtasks",
  parameters: z.object({
    request: z
      .string()
      .describe("The complex task or feature request to orchestrate"),
    context: z
      .string()
      .optional()
      .describe("Additional context about the project or requirements"),
    constraints: z
      .array(z.string())
      .optional()
      .describe("Any constraints or limitations to consider"),
    priority: z
      .enum(["low", "medium", "high", "urgent"])
      .default("medium")
      .describe("Overall priority of the task"),
  }),
  execute: async ({ request, context, constraints, priority }) => {
    // Generate implementation plan
    const implementationPlan = {
      request,
      context: context || "No additional context provided",
      constraints: constraints || [],
      priority,
      items: [
        {
          purpose: "Research and analyze requirements",
          category: "research" as const,
          deliverable:
            "Requirements analysis document with technical specifications",
          priority: "high" as const,
          estimatedComplexity: "medium" as const,
          dependencies: [],
          estimatedDuration: "1-2 hours",
        },
        {
          purpose: "Design system architecture and user experience",
          category: "design" as const,
          deliverable: "System architecture diagrams and UX wireframes",
          priority: "high" as const,
          estimatedComplexity: "high" as const,
          dependencies: ["requirements-analysis"],
          estimatedDuration: "2-3 hours",
        },
        {
          purpose: "Develop core functionality and APIs",
          category: "development" as const,
          deliverable: "Working application with core features implemented",
          priority: "high" as const,
          estimatedComplexity: "high" as const,
          dependencies: ["system-design"],
          estimatedDuration: "4-6 hours",
        },
        {
          purpose: "Create comprehensive test suite",
          category: "testing" as const,
          deliverable:
            "Unit tests, integration tests, and test coverage report",
          priority: "medium" as const,
          estimatedComplexity: "medium" as const,
          dependencies: ["core-development"],
          estimatedDuration: "2-3 hours",
        },
        {
          purpose: "Deploy and configure production environment",
          category: "deployment" as const,
          deliverable: "Live application deployed with monitoring and logging",
          priority: "medium" as const,
          estimatedComplexity: "medium" as const,
          dependencies: ["testing-complete"],
          estimatedDuration: "1-2 hours",
        },
        {
          purpose: "Create user documentation and API docs",
          category: "documentation" as const,
          deliverable:
            "User guide, API documentation, and developer onboarding guide",
          priority: "low" as const,
          estimatedComplexity: "low" as const,
          dependencies: ["deployment-complete"],
          estimatedDuration: "1-2 hours",
        },
      ],
      estimatedDuration: "8-12 hours total",
      riskLevel: "medium",
      successCriteria: [
        "All requirements are met and validated",
        "System follows architectural best practices",
        "Comprehensive test coverage (>80%)",
        "Application is deployed and accessible",
        "Documentation is complete and user-friendly",
      ],
    };

    return { state: "ready" as const, plan: implementationPlan };
  },
});

export type OrchestratorUIToolInvocation = {
  state:
    | "loading"
    | "ready"
    | "input-streaming"
    | "input-available"
    | "output-available"
    | "output-error";
  input?: {
    request: string;
    context?: string;
    constraints?: string[];
    priority: "low" | "medium" | "high" | "urgent";
  };
  output?: {
    state: "loading" | "ready";
    plan?: {
      request: string;
      context: string;
      constraints: string[];
      priority: string;
      items: Array<{
        purpose: string;
        category:
          | "research"
          | "design"
          | "development"
          | "testing"
          | "deployment"
          | "documentation";
        deliverable: string;
        priority: "low" | "medium" | "high";
        estimatedComplexity: "low" | "medium" | "high";
        dependencies?: string[];
        estimatedDuration: string;
      }>;
      estimatedDuration: string;
      riskLevel: string;
      successCriteria: string[];
    };
  };
  errorText?: string;
};
