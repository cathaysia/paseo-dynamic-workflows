import type {
  PluginClientContext,
  PluginSidebarItemProps,
} from "@getpaseo/plugin/client";
import { SidebarRow } from "@getpaseo/plugin/client/ui";
import { WorkflowScreen } from "./client/workflow";
import { WorkflowWorkspacePanel } from "./client/workflow-panel";
import { WorkflowTimelineCard } from "./client/workflow-card";
import { WorkflowTimelineDataSchema } from "./shared/timeline";
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
  // 1. 注册全屏工作流视图
  client.addScreen({
    id: "workflows",
    title: "Workflows",
    Component: WorkflowScreen,
  });

  // 2. 注册侧边栏入口
  client.addSidebarHeaderItem({
    id: "workflows",
    title: "Workflows",
    Component: WorkflowSidebarItem,
  });

  // 3. 注册工作区面板（与 Agent、Diff、Terminal 并列的拓扑可视化面板）
  client.addWorkspacePanel({
    id: "workflow-topology",
    title: "Workflow Graph",
    icon: "GitBranch",
    locations: ["workspace", "explorer"],
    context: "workspace",
    Component: WorkflowWorkspacePanel,
  });

  // 4. 注册聊天 Timeline 卡片渲染器（在会话中渲染交互式执行节点与 Phase 进度）
  client.addTimelineRenderer({
    kind: "workflow-card",
    version: 1,
    schema: WorkflowTimelineDataSchema,
    Component: WorkflowTimelineCard,
  });

  // 5. 注册客户端 Slash 命令: /workflow [path]
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
