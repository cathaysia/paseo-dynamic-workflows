import type { PluginClientContext } from "@getpaseo/plugin/client";
import { WorkflowTimelineCard } from "./client/workflow-card";
import { WorkflowTimelineDataSchema } from "./shared/timeline";
import {
  runWorkflowRpc,
  cancelWorkflowRpc,
  retryAgentRpc,
  deleteWorkflowRpc,
} from "./shared/contracts";

export default function contribute(client: PluginClientContext) {
  client.addTimelineRenderer({
    kind: "workflow-card",
    version: 1,
    schema: WorkflowTimelineDataSchema,
    Component: WorkflowTimelineCard,
  });

  client.addSlashCommand({
    name: "workflow",
    description: "Launch a dynamic workflow script with subagent topology & caching",
    argumentHint: "<script-path-or-task>",
    context: "agent",
    onSubmit: async ({ args, agent, workspace, rpc }) => {
      const scriptPath = args.trim();
      if (!scriptPath) return;

      await rpc(runWorkflowRpc, {
        path: scriptPath,
        cwd: workspace.directory,
        workspaceId: workspace.id,
        parentAgentId: agent.id,
      });
    },
  });

  client.addSlashCommand({
    name: "workflow-cancel",
    description: "Cancel a running workflow execution",
    argumentHint: "<runId>",
    context: "agent",
    onSubmit: async ({ args, rpc }) => {
      const runId = args.trim();
      if (!runId) return;
      await rpc(cancelWorkflowRpc, { runId });
    },
  });

  client.addSlashCommand({
    name: "workflow-retry",
    description: "Invalidate cache and retry a specific agent",
    argumentHint: "<runId> <agentName>",
    context: "agent",
    onSubmit: async ({ args, rpc }) => {
      const parts = args.trim().split(/\s+/);
      if (parts.length < 2) return;
      await rpc(retryAgentRpc, { runId: parts[0], agentName: parts[1] });
    },
  });

  client.addSlashCommand({
    name: "workflow-delete",
    description: "Delete a workflow run and its step cache",
    argumentHint: "<runId>",
    context: "agent",
    onSubmit: async ({ args, rpc }) => {
      const runId = args.trim();
      if (!runId) return;
      await rpc(deleteWorkflowRpc, { runId });
    },
  });

  return () => {};
}
