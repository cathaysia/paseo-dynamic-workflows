import type { PluginWorkspacePanelProps } from "@getpaseo/plugin/client";
import { useRpc } from "@getpaseo/plugin/client";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { listWorkflowsRpc } from "../shared/contracts";
import type { WorkflowRunStatus } from "../shared/types";

export function WorkflowWorkspacePanel({
  theme,
}: PluginWorkspacePanelProps) {
  const listWorkflows = useRpc(listWorkflowsRpc);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);

  const { data: runs, refetch } = useQuery({
    queryKey: ["workspace-workflows"],
    queryFn: () => listWorkflows({ limit: 10 }),
    refetchInterval: 3000,
  });

  const selectedRun: WorkflowRunStatus | undefined = useMemo(() => {
    if (!runs || runs.length === 0) return undefined;
    if (selectedRunId) {
      return runs.find((r) => r.runId === selectedRunId) || runs[0];
    }
    return runs[0];
  }, [runs, selectedRunId]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface0 }]}>
      {/* Top Header */}
      <View style={[styles.header, { borderColor: theme.colors.border }]}>
        <View style={styles.headerLeft}>
          <Text style={[styles.headerTitle, { color: theme.colors.foreground }]}>
            Workflow Topology & Visualizer
          </Text>
          <Text style={[styles.headerSub, { color: theme.colors.foregroundMuted }]}>
            Live execution graph, phase gates, and cache statistics
          </Text>
        </View>

        <Pressable
          style={[styles.refreshBtn, { backgroundColor: theme.colors.surface1, borderColor: theme.colors.border }]}
          onPress={() => refetch()}
        >
          <Text style={[styles.refreshBtnText, { color: theme.colors.foreground }]}>
            ↻ Refresh
          </Text>
        </Pressable>
      </View>

      <View style={styles.body}>
        {/* Runs List Sidebar */}
        <View style={[styles.sidebar, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface1 }]}>
          <Text style={[styles.sectionLabel, { color: theme.colors.foregroundMuted }]}>
            WORKFLOW RUNS
          </Text>
          <ScrollView>
            {runs?.map((r) => {
              const isSelected = selectedRun?.runId === r.runId;
              return (
                <Pressable
                  key={r.runId}
                  style={[
                    styles.runItem,
                    isSelected && { backgroundColor: theme.colors.surface2 },
                  ]}
                  onPress={() => setSelectedRunId(r.runId)}
                >
                  <Text style={[styles.runIdText, { color: theme.colors.foreground }]}>
                    {r.runId}
                  </Text>
                  <Text
                    style={[
                      styles.statusPill,
                      {
                        color:
                          r.status === "completed"
                            ? theme.colors.statusSuccess
                            : r.status === "failed"
                            ? theme.colors.statusDanger
                            : theme.colors.accent,
                      },
                    ]}
                  >
                    ● {r.status}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Visual Graph / Detail View */}
        <ScrollView style={styles.mainView}>
          {selectedRun ? (
            <View style={styles.detailCard}>
              {/* Metric Highlights */}
              <View style={styles.metricsRow}>
                <View style={[styles.metricTile, { backgroundColor: theme.colors.surface1, borderColor: theme.colors.border }]}>
                  <Text style={[styles.metricNum, { color: theme.colors.statusSuccess }]}>
                    {selectedRun.cachedStepsCount}
                  </Text>
                  <Text style={[styles.metricLabel, { color: theme.colors.foregroundMuted }]}>
                    Cached Steps (0 Token)
                  </Text>
                </View>

                <View style={[styles.metricTile, { backgroundColor: theme.colors.surface1, borderColor: theme.colors.border }]}>
                  <Text style={[styles.metricNum, { color: theme.colors.foreground }]}>
                    {selectedRun.liveStepsCount}
                  </Text>
                  <Text style={[styles.metricLabel, { color: theme.colors.foregroundMuted }]}>
                    Live Executions
                  </Text>
                </View>

                <View style={[styles.metricTile, { backgroundColor: theme.colors.surface1, borderColor: theme.colors.border }]}>
                  <Text style={[styles.metricNum, { color: theme.colors.accent }]}>
                    {selectedRun.phases.length}
                  </Text>
                  <Text style={[styles.metricLabel, { color: theme.colors.foregroundMuted }]}>
                    Total Phases
                  </Text>
                </View>
              </View>

              {/* Topological Flow / Stepper Graph */}
              <Text style={[styles.sectionTitle, { color: theme.colors.foreground }]}>
                Execution Flow Graph (Phases & Gates)
              </Text>

              <View style={styles.graphContainer}>
                {selectedRun.phases.map((p, idx) => {
                  const isCurrent = selectedRun.currentPhase === p.title;
                  return (
                    <View key={idx} style={styles.graphNodeRow}>
                      <View style={[styles.nodeCircle, { backgroundColor: isCurrent ? theme.colors.accent : theme.colors.statusSuccess }]}>
                        <Text style={styles.nodeCircleText}>{idx + 1}</Text>
                      </View>

                      <View
                        style={[
                          styles.nodeCard,
                          {
                            backgroundColor: theme.colors.surface1,
                            borderColor: isCurrent ? theme.colors.accent : theme.colors.border,
                          },
                        ]}
                      >
                        <Text style={[styles.nodeTitle, { color: theme.colors.foreground }]}>
                          {p.title}
                        </Text>
                        <Text style={[styles.nodeTime, { color: theme.colors.foregroundMuted }]}>
                          {new Date(p.timestamp).toLocaleTimeString()}
                        </Text>
                      </View>

                      {idx < selectedRun.phases.length - 1 && (
                        <View style={[styles.nodeLine, { backgroundColor: theme.colors.border }]} />
                      )}
                    </View>
                  );
                })}
              </View>

              {/* Live Reports Table */}
              {selectedRun.reports && selectedRun.reports.length > 0 && (
                <View style={styles.reportsSection}>
                  <Text style={[styles.sectionTitle, { color: theme.colors.foreground }]}>
                    Live Telemetry Stream
                  </Text>
                  <View style={[styles.reportsTable, { backgroundColor: theme.colors.surface1, borderColor: theme.colors.border }]}>
                    {selectedRun.reports.map((rep, idx) => (
                      <View key={idx} style={[styles.reportTableRow, { borderColor: theme.colors.border }]}>
                        <Text style={[styles.reportTime, { color: theme.colors.foregroundMuted }]}>
                          {new Date(rep.timestamp).toLocaleTimeString()}
                        </Text>
                        <Text style={[styles.reportJson, { color: theme.colors.foreground }]}>
                          {typeof rep.payload === "string" ? rep.payload : JSON.stringify(rep.payload)}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.emptyView}>
              <Text style={[styles.emptyText, { color: theme.colors.foregroundMuted }]}>
                No workflow runs recorded yet.
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerLeft: {
    gap: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
  headerSub: {
    fontSize: 12,
  },
  refreshBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  refreshBtnText: {
    fontSize: 12,
    fontWeight: "600",
  },
  body: {
    flex: 1,
    flexDirection: "row",
  },
  sidebar: {
    width: 220,
    borderRightWidth: 1,
    padding: 10,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: "700",
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  runItem: {
    padding: 10,
    borderRadius: 6,
    marginBottom: 6,
    gap: 4,
  },
  runIdText: {
    fontSize: 12,
    fontWeight: "600",
  },
  statusPill: {
    fontSize: 11,
  },
  mainView: {
    flex: 1,
    padding: 16,
  },
  detailCard: {
    gap: 16,
  },
  metricsRow: {
    flexDirection: "row",
    gap: 12,
  },
  metricTile: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    gap: 4,
  },
  metricNum: {
    fontSize: 22,
    fontWeight: "bold",
  },
  metricLabel: {
    fontSize: 11,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginTop: 8,
  },
  graphContainer: {
    paddingVertical: 10,
    gap: 12,
  },
  graphNodeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  nodeCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  nodeCircleText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  nodeCard: {
    flex: 1,
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  nodeTitle: {
    fontSize: 13,
    fontWeight: "600",
  },
  nodeTime: {
    fontSize: 11,
  },
  nodeLine: {
    position: "absolute",
    left: 13,
    top: 28,
    width: 2,
    height: 12,
  },
  reportsSection: {
    gap: 8,
  },
  reportsTable: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 8,
  },
  reportTableRow: {
    flexDirection: "row",
    paddingVertical: 6,
    borderBottomWidth: 0.5,
    gap: 10,
  },
  reportTime: {
    fontSize: 11,
    width: 70,
  },
  reportJson: {
    flex: 1,
    fontSize: 11,
    fontFamily: "monospace",
  },
  emptyView: {
    padding: 40,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
  },
});
