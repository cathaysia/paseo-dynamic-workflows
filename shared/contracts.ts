import { defineRpc } from "@getpaseo/plugin";
import { z } from "zod";
import { WorkflowRunInputSchema, WorkflowRunStatusSchema } from "./types";

export const runWorkflowRpc = defineRpc({
  name: "workflow.run",
  input: WorkflowRunInputSchema,
  output: WorkflowRunStatusSchema,
});

export const getWorkflowStatusRpc = defineRpc({
  name: "workflow.status",
  input: z.object({
    runId: z.string(),
  }),
  output: WorkflowRunStatusSchema.nullable(),
});

export const listWorkflowsRpc = defineRpc({
  name: "workflow.list",
  input: z.object({
    limit: z.number().optional().default(20),
  }),
  output: z.array(WorkflowRunStatusSchema),
});

export const cancelWorkflowRpc = defineRpc({
  name: "workflow.cancel",
  input: z.object({
    runId: z.string(),
  }),
  output: z.object({
    success: z.boolean(),
  }),
});

export const retryAgentRpc = defineRpc({
  name: "workflow.retry-agent",
  input: z.object({
    runId: z.string(),
    agentName: z.string(),
  }),
  output: WorkflowRunStatusSchema,
});

export const deleteWorkflowRpc = defineRpc({
  name: "workflow.delete",
  input: z.object({
    runId: z.string(),
  }),
  output: z.object({
    success: z.boolean(),
  }),
});
