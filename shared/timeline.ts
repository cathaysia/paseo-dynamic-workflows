import { z } from "zod";

export const WorkflowTimelineDataSchema = z.object({
  runId: z.string(),
  status: z.enum(["running", "completed", "failed", "cancelled"]),
  currentPhase: z.string().optional(),
  phases: z.array(
    z.object({
      title: z.string(),
      timestamp: z.number(),
      status: z.enum(["pending", "running", "completed", "failed"]).optional(),
      workers: z.array(
        z.object({
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
        })
      ).optional(),
      rounds: z.number().optional(),
      gate: z.object({
        command: z.string(),
        exitCode: z.number(),
        status: z.enum(["passed", "failed"]),
      }).optional(),
    })
  ),
  reports: z.array(
    z.object({
      timestamp: z.number(),
      payload: z.any(),
    })
  ),
  cachedStepsCount: z.number(),
  liveStepsCount: z.number(),
  result: z.any().optional(),
  error: z.string().optional(),
  artifacts: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      kind: z.string(),
      size: z.string().optional(),
    })
  ).optional(),
});

export type WorkflowTimelineData = z.infer<typeof WorkflowTimelineDataSchema>;
