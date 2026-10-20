import { z } from "zod";

export const WorkflowRunInputSchema = z.object({
  script: z.string().optional(),
  path: z.string().optional(),
  cwd: z.string(),
  workspaceId: z.string().optional(),
  parentAgentId: z.string().optional(),
  maxConcurrency: z.number().int().positive().default(4),
  subagentModel: z.string().optional(),
});

export type WorkflowRunInput = z.infer<typeof WorkflowRunInputSchema>;

export const WorkflowPhaseSchema = z.object({
  title: z.string(),
  timestamp: z.number(),
});

export const WorkflowReportItemSchema = z.object({
  timestamp: z.number(),
  payload: z.any(),
});

export const WorkflowRunStatusSchema = z.object({
  runId: z.string(),
  status: z.enum(["running", "completed", "failed", "cancelled"]),
  currentPhase: z.string().optional(),
  phases: z.array(WorkflowPhaseSchema),
  reports: z.array(WorkflowReportItemSchema),
  result: z.any().optional(),
  error: z.string().optional(),
  cachedStepsCount: z.number(),
  liveStepsCount: z.number(),
  startedAt: z.number(),
  completedAt: z.number().optional(),
});

export type WorkflowRunStatus = z.infer<typeof WorkflowRunStatusSchema>;
