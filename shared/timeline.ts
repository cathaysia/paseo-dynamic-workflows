import { z } from "zod";

export const WorkflowTimelineDataSchema = z.object({
  runId: z.string(),
  status: z.enum(["running", "completed", "failed", "cancelled"]),
  currentPhase: z.string().optional(),
  phases: z.array(
    z.object({
      title: z.string(),
      timestamp: z.number(),
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
});

export type WorkflowTimelineData = z.infer<typeof WorkflowTimelineDataSchema>;
