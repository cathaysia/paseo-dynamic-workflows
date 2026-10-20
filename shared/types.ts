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

export const WorkflowWorkerItemSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  model: z.string().optional(),
  status: z.enum(["pending", "running", "completed", "cached", "failed"]),
  duration: z.string().optional(),
  avatarColor: z.string().optional(),
  tasksCount: z.number().optional(),
  dependsOn: z.array(z.string()).optional(),
  outputSnippet: z.string().optional(),
  worktree: z.string().optional(),
});

export type WorkflowWorkerItem = z.infer<typeof WorkflowWorkerItemSchema>;

export const WorkflowPhaseSchema = z.object({
  title: z.string(),
  timestamp: z.number(),
  status: z.enum(["pending", "running", "completed", "failed"]).optional(),
  workers: z.array(WorkflowWorkerItemSchema).optional(),
  rounds: z.number().optional(),
  gate: z.object({
    command: z.string(),
    exitCode: z.number(),
    status: z.enum(["passed", "failed"]),
  }).optional(),
});

export const WorkflowArtifactItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  kind: z.string(),
  size: z.string().optional(),
});

export type WorkflowArtifactItem = z.infer<typeof WorkflowArtifactItemSchema>;

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
  artifacts: z.array(WorkflowArtifactItemSchema).optional(),
});

export type WorkflowRunStatus = z.infer<typeof WorkflowRunStatusSchema>;
