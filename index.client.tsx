import type { PluginClientContext } from "@getpaseo/plugin/client";
import { WorkflowTimelineCard } from "./client/workflow-card";
import { WorkflowTimelineDataSchema } from "./shared/timeline";
import { runWorkflowRpc } from "./shared/contracts";

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

  return () => {};
}
