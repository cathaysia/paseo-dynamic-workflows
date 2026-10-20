import type {
  PluginClientContext,
  PluginSidebarItemProps,
} from "@getpaseo/plugin/client";
import { SidebarRow } from "@getpaseo/plugin/client/ui";
import { WorkflowScreen } from "./client/workflow";
import { runWorkflowRpc } from "./shared/contracts";

function WorkflowSidebarItem({
  currentScreen,
  openScreen,
}: PluginSidebarItemProps) {
  return (
    <SidebarRow
      icon="GitBranch"
      active={currentScreen?.screenId === "workflows"}
      onPress={() => openScreen({ screenId: "workflows" })}
    />
  );
}

export default function contribute(client: PluginClientContext) {
  client.addScreen({
    id: "workflows",
    title: "Workflows",
    Component: WorkflowScreen,
  });

  client.addSidebarHeaderItem({
    id: "workflows",
    title: "Workflows",
    Component: WorkflowSidebarItem,
  });

  // 注册客户端 Slash 命令: /workflow [path]
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
