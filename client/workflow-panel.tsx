import type { PluginWorkspacePanelProps } from "@getpaseo/plugin/client";
import { useMemo } from "react";
import { View, Text } from "react-native";
import type { WorkflowRunStatus } from "../shared/types";
import { WorkflowTimelineCard } from "./workflow-card";

export interface WorkflowTopologyViewerProps {
  runs?: WorkflowRunStatus[];
  selectedRunId?: string | null;
  onSelectRun?: (id: string) => void;
  onRefresh?: () => void;
  theme?: any;
}

export function WorkflowTopologyViewer({
  runs,
  selectedRunId,
  theme,
}: WorkflowTopologyViewerProps) {
  const selectedRun = useMemo(() => {
    if (!runs || runs.length === 0) return null;
    return runs.find((r) => r.runId === selectedRunId) ?? runs[0];
  }, [runs, selectedRunId]);

  if (!selectedRun) {
    return (
      <View style={{ padding: 40, alignItems: "center" }}>
        <Text style={{ color: "#64748b", fontSize: 13 }}>No workflow runs recorded yet.</Text>
      </View>
    );
  }

  return (
    <WorkflowTimelineCard
      theme={theme}
      item={{
        type: "plugin",
        kind: "workflow-card",
        version: 1,
        data: selectedRun as any,
      }}
    />
  );
}

export function WorkflowWorkspacePanel({
  theme,
}: PluginWorkspacePanelProps) {
  return null;
}
