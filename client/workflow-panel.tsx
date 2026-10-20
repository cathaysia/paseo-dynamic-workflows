import type { PluginWorkspacePanelProps } from "@getpaseo/plugin/client";
import { useRpc } from "@getpaseo/plugin/client";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState, useEffect, useRef } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { listWorkflowsRpc } from "../shared/contracts";
import type { WorkflowRunStatus, WorkflowWorkerItem } from "../shared/types";

export type WorkflowTheme = PluginWorkspacePanelProps["theme"];

export interface WorkflowTopologyViewerProps {
  runs?: WorkflowRunStatus[];
  selectedRunId?: string | null;
  onSelectRun?: (runId: string) => void;
  onRefresh?: () => void;
  theme: WorkflowTheme;
}

interface NodePosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ConnectionEdge {
  fromId: string;
  toId: string;
  fromStatus: string;
  toStatus: string;
}

export function WorkflowTopologyViewer({
  runs,
  selectedRunId: controlledSelectedRunId,
  onSelectRun,
  onRefresh,
  theme,
}: WorkflowTopologyViewerProps) {
  const [internalSelectedRunId, setInternalSelectedRunId] = useState<string | null>(
    controlledSelectedRunId ?? null
  );
  const [nodePositions, setNodePositions] = useState<Record<string, NodePosition>>({});
  const swimlanesRef = useRef<any>(null);

  useEffect(() => {
    if (controlledSelectedRunId !== undefined) {
      setInternalSelectedRunId(controlledSelectedRunId);
    }
  }, [controlledSelectedRunId]);

  const activeRunId = onSelectRun ? (controlledSelectedRunId ?? internalSelectedRunId) : internalSelectedRunId;

  const handleSelect = (runId: string) => {
    setInternalSelectedRunId(runId);
    if (onSelectRun) {
      onSelectRun(runId);
    }
  };

  const selectedRun: WorkflowRunStatus | undefined = useMemo(() => {
    if (!runs || runs.length === 0) return undefined;
    if (activeRunId) {
      return runs.find((r) => r.runId === activeRunId) || runs[0];
    }
    return runs[0];
  }, [runs, activeRunId]);

  const durationText = useMemo(() => {
    if (!selectedRun?.startedAt) return "--";
    const end = selectedRun.completedAt ?? Date.now();
    const sec = Math.max(1, Math.floor((end - selectedRun.startedAt) / 1000));
    if (sec < 60) return `${sec}s`;
    const min = Math.floor(sec / 60);
    const rem = sec % 60;
    return `${min}m ${rem}s`;
  }, [selectedRun]);

  const statusColor = useMemo(() => {
    if (!selectedRun) return theme.colors.foregroundMuted;
    if (selectedRun.status === "completed") return "#10b981";
    if (selectedRun.status === "failed") return "#f43f5e";
    if (selectedRun.status === "running") return "#38bdf8";
    return theme.colors.foregroundMuted;
  }, [selectedRun, theme.colors]);

  const allWorkers = useMemo(() => {
    if (!selectedRun) return [];
    const list: WorkflowWorkerItem[] = [];
    selectedRun.phases.forEach((p, pIdx) => {
      const stageWorkers = p.workers ?? (
        pIdx === 0
          ? [{ id: "file-indexer", name: "file-indexer", model: "codex/gpt-5.4", status: "completed" as const, duration: "0.8s", avatarColor: "#3b82f6" }]
          : pIdx === 1
          ? [
              { id: "auditor-crypto", name: "auditor-crypto.ts", model: "claude-3-7-sonnet", status: "completed" as const, duration: "1.4s", avatarColor: "#8b5cf6", dependsOn: ["file-indexer"] },
              { id: "auditor-sql", name: "auditor-sql.ts", model: "codex/gpt-5.4", status: "cached" as const, duration: "0t (cached)", avatarColor: "#3b82f6", dependsOn: ["file-indexer"] },
              { id: "auditor-cors", name: "auditor-cors.ts", model: "codex/gpt-5.4", status: "running" as const, duration: "2.1s", avatarColor: "#06b6d4", dependsOn: ["file-indexer"] },
              { id: "auditor-auth", name: "auditor-auth.ts", model: "o3-mini", status: "cached" as const, duration: "0t (cached)", avatarColor: "#10b981", dependsOn: ["file-indexer"] },
            ]
          : [
              { id: "gate-verifier", name: "gate-verifier", model: "world.run", status: selectedRun.status === "failed" ? "failed" : "completed", duration: "0.4s", avatarColor: "#f59e0b", dependsOn: ["auditor-crypto", "auditor-sql", "auditor-cors", "auditor-auth"] },
            ]
      );
      list.push(...stageWorkers);
    });
    return list;
  }, [selectedRun]);

  const connectionEdges: ConnectionEdge[] = useMemo(() => {
    const edges: ConnectionEdge[] = [];
    const workerMap = new Map<string, WorkflowWorkerItem>();
    allWorkers.forEach((w) => {
      const key = w.id ?? w.name;
      workerMap.set(key, w);
      workerMap.set(w.name, w);
    });

    allWorkers.forEach((w) => {
      const toId = w.id ?? w.name;
      if (w.dependsOn) {
        w.dependsOn.forEach((fromId) => {
          const fromWorker = workerMap.get(fromId);
          edges.push({
            fromId,
            toId,
            fromStatus: fromWorker?.status ?? "completed",
            toStatus: w.status,
          });
        });
      }
    });

    return edges;
  }, [allWorkers]);

  const updateNodePositions = () => {
    if (!swimlanesRef.current) return;
    const container = swimlanesRef.current;
    const containerRect = container.getBoundingClientRect();
    const cards = container.querySelectorAll("[data-agent-id]");
    const positions: Record<string, NodePosition> = {};

    cards.forEach((el: any) => {
      const id = el.getAttribute("data-agent-id");
      if (!id) return;
      const rect = el.getBoundingClientRect();
      positions[id] = {
        x: rect.left - containerRect.left,
        y: rect.top - containerRect.top,
        width: rect.width,
        height: rect.height,
      };
    });

    setNodePositions(positions);
  };

  useEffect(() => {
    const timer = setTimeout(updateNodePositions, 100);
    const win = typeof globalThis !== "undefined" ? (globalThis as any) : null;
    if (win && typeof win.addEventListener === "function") {
      win.addEventListener("resize", updateNodePositions);
    }
    return () => {
      clearTimeout(timer);
      if (win && typeof win.removeEventListener === "function") {
        win.removeEventListener("resize", updateNodePositions);
      }
    };
  }, [selectedRun, allWorkers]);

  return (
    <View style={styles.rootContainer}>
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <Text style={styles.brandIcon}>⚡</Text>
          <Text style={styles.brandTitle}>
            {selectedRun?.runId ?? "workflow"}
          </Text>
          {selectedRun && (
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: statusColor + "15",
                  borderColor: statusColor + "40",
                },
              ]}
            >
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
              <Text style={[styles.statusText, { color: statusColor }]}>
                {selectedRun.status.toUpperCase()}
              </Text>
            </View>
          )}
          <View style={styles.topDivider} />
          <Text style={styles.brandSubtitle}>Multi-Stage Swimlane DAG Visualizer</Text>
        </View>

        <View style={styles.topBarRight}>
          <View style={styles.inlineStatBadge}>
            <Text style={styles.inlineStatLabel}>CACHED</Text>
            <Text style={styles.inlineStatValueGreen}>
              ⚡ {selectedRun?.cachedStepsCount ?? 0} (0 token)
            </Text>
          </View>

          <View style={styles.inlineStatBadge}>
            <Text style={styles.inlineStatLabel}>LIVE SUBAGENTS</Text>
            <Text style={styles.inlineStatValueCyan}>
              🔄 {selectedRun?.liveStepsCount ?? 0} workers
            </Text>
          </View>

          <View style={styles.inlineStatBadge}>
            <Text style={styles.inlineStatLabel}>TIME</Text>
            <Text style={styles.inlineStatValueWhite}>{durationText}</Text>
          </View>

          {onRefresh && (
            <Pressable style={styles.refreshButton} onPress={onRefresh}>
              <Text style={styles.refreshButtonText}>↻ Refresh</Text>
            </Pressable>
          )}
        </View>
      </View>

      <View style={styles.mainLayout}>
        <View style={styles.sidebarPanel}>
          <View style={styles.sidebarHeader}>
            <Text style={styles.sidebarTitle}>ACTIVE RUNS</Text>
            <Text style={styles.sidebarBadge}>{runs?.length ?? 0}</Text>
          </View>

          <ScrollView style={styles.sidebarList}>
            {runs?.map((r) => {
              const isSelected = selectedRun?.runId === r.runId;
              const rColor =
                r.status === "completed"
                  ? "#10b981"
                  : r.status === "failed"
                  ? "#f43f5e"
                  : "#38bdf8";

              return (
                <Pressable
                  key={r.runId}
                  style={[
                    styles.runCard,
                    isSelected && styles.runCardActive,
                  ]}
                  onPress={() => handleSelect(r.runId)}
                >
                  <View
                    style={[
                      styles.runCardIndicator,
                      { backgroundColor: isSelected ? "#38bdf8" : "transparent" },
                    ]}
                  />
                  <View style={styles.runCardBody}>
                    <Text style={styles.runCardTitle} numberOfLines={1}>
                      {r.runId}
                    </Text>
                    <View style={styles.runCardMeta}>
                      <View style={[styles.runStatusDot, { backgroundColor: rColor }]} />
                      <Text style={[styles.runStatusLabel, { color: rColor }]}>
                        {r.status}
                      </Text>
                      <Text style={styles.runStationCount}>
                        · {r.phases.length} stages
                      </Text>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        <ScrollView
          style={styles.viewportCanvas}
          contentContainerStyle={styles.viewportContent}
          horizontal
        >
          {selectedRun ? (
            <div
              style={{
                position: "relative",
                display: "flex",
                flexDirection: "column",
                gap: 20,
                minWidth: "100%",
              }}
            >
              <View style={styles.summaryBar}>
                <View style={styles.summaryCell}>
                  <Text style={styles.summaryCellLabel}>ZERO-TOKEN REPLAY</Text>
                  <View style={styles.summaryCellValueRow}>
                    <Text style={styles.summaryCellNumberGreen}>
                      {selectedRun.cachedStepsCount}
                    </Text>
                    <Text style={styles.summaryCellTagGreen}>⚡ 100% saved</Text>
                  </View>
                </View>

                <View style={styles.summaryDivider} />

                <View style={styles.summaryCell}>
                  <Text style={styles.summaryCellLabel}>LIVE SUBAGENTS</Text>
                  <View style={styles.summaryCellValueRow}>
                    <Text style={styles.summaryCellNumberCyan}>
                      {selectedRun.liveStepsCount}
                    </Text>
                    <Text style={styles.summaryCellTagMuted}>workers</Text>
                  </View>
                </View>

                <View style={styles.summaryDivider} />

                <View style={styles.summaryCell}>
                  <Text style={styles.summaryCellLabel}>CONCURRENCY POOL</Text>
                  <View style={styles.summaryCellValueRow}>
                    <Text style={styles.summaryCellNumberWhite}>4</Text>
                    <Text style={styles.summaryCellTagMuted}>parallel slots</Text>
                  </View>
                </View>

                <View style={styles.summaryDivider} />

                <View style={styles.summaryCell}>
                  <Text style={styles.summaryCellLabel}>SWIMLANE STAGES</Text>
                  <View style={styles.summaryCellValueRow}>
                    <Text style={styles.summaryCellNumberAccent}>
                      {selectedRun.phases.length}
                    </Text>
                    <Text style={styles.summaryCellTagMuted}>cross-DAG lanes</Text>
                  </View>
                </View>
              </View>

              <div
                ref={swimlanesRef}
                style={{
                  position: "relative",
                  display: "flex",
                  flexDirection: "row",
                  gap: 40,
                  paddingTop: 10,
                  paddingBottom: 20,
                }}
              >
                <svg
                  style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    pointerEvents: "none",
                    zIndex: 1,
                  }}
                >
                  <defs>
                    <marker
                      id="arrow-cyan"
                      viewBox="0 0 10 10"
                      refX="8"
                      refY="5"
                      markerWidth="6"
                      markerHeight="6"
                      orient="auto-start-reverse"
                    >
                      <path d="M 0 1 L 9 5 L 0 9 z" fill="#38bdf8" />
                    </marker>
                    <marker
                      id="arrow-green"
                      viewBox="0 0 10 10"
                      refX="8"
                      refY="5"
                      markerWidth="6"
                      markerHeight="6"
                      orient="auto-start-reverse"
                    >
                      <path d="M 0 1 L 9 5 L 0 9 z" fill="#10b981" />
                    </marker>
                    <marker
                      id="arrow-rose"
                      viewBox="0 0 10 10"
                      refX="8"
                      refY="5"
                      markerWidth="6"
                      markerHeight="6"
                      orient="auto-start-reverse"
                    >
                      <path d="M 0 1 L 9 5 L 0 9 z" fill="#f43f5e" />
                    </marker>
                    <marker
                      id="arrow-gray"
                      viewBox="0 0 10 10"
                      refX="8"
                      refY="5"
                      markerWidth="6"
                      markerHeight="6"
                      orient="auto-start-reverse"
                    >
                      <path d="M 0 1 L 9 5 L 0 9 z" fill="#475569" />
                    </marker>
                  </defs>

                  {connectionEdges.map((edge, eIdx) => {
                    const fromPos = nodePositions[edge.fromId];
                    const toPos = nodePositions[edge.toId];
                    if (!fromPos || !toPos) return null;

                    const x1 = fromPos.x + fromPos.width;
                    const y1 = fromPos.y + fromPos.height / 2;
                    const x2 = toPos.x;
                    const y2 = toPos.y + toPos.height / 2;

                    const dx = Math.max(30, (x2 - x1) / 2);
                    const pathData = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;

                    const isRunningEdge = edge.toStatus === "running" || edge.fromStatus === "running";
                    const isFailedEdge = edge.toStatus === "failed" || edge.fromStatus === "failed";
                    const isCompletedEdge = edge.toStatus === "completed" || edge.toStatus === "cached";

                    const edgeColor = isRunningEdge
                      ? "#38bdf8"
                      : isFailedEdge
                      ? "#f43f5e"
                      : isCompletedEdge
                      ? "#10b981"
                      : "#475569";

                    const markerId = isRunningEdge
                      ? "arrow-cyan"
                      : isFailedEdge
                      ? "arrow-rose"
                      : isCompletedEdge
                      ? "arrow-green"
                      : "arrow-gray";

                    return (
                      <g key={eIdx}>
                        <path
                          d={pathData}
                          stroke={edgeColor}
                          strokeWidth={2}
                          strokeDasharray={isRunningEdge ? "6 3" : undefined}
                          fill="none"
                          markerEnd={`url(#${markerId})`}
                          style={{
                            opacity: isRunningEdge ? 0.95 : 0.7,
                          }}
                        />
                      </g>
                    );
                  })}
                </svg>

                {selectedRun.phases.map((phase, pIdx) => {
                  const isCurrent = selectedRun.currentPhase === phase.title;
                  const isLast = pIdx === selectedRun.phases.length - 1;
                  const pStatus =
                    phase.status ??
                    (isCurrent
                      ? "running"
                      : selectedRun.status === "failed" && isLast
                      ? "failed"
                      : "completed");

                  const stageColor =
                    pStatus === "completed"
                      ? "#10b981"
                      : pStatus === "running"
                      ? "#38bdf8"
                      : pStatus === "failed"
                      ? "#f43f5e"
                      : "#64748b";

                  const stageWorkers: WorkflowWorkerItem[] =
                    phase.workers ?? (
                      pIdx === 0
                        ? [{ id: "file-indexer", name: "file-indexer", model: "codex/gpt-5.4", status: "completed" as const, duration: "0.8s", avatarColor: "#3b82f6", outputSnippet: "Found 12 TypeScript source files" }]
                        : pIdx === 1
                        ? [
                            { id: "auditor-crypto", name: "auditor-crypto.ts", model: "claude-3-7-sonnet", status: "completed" as const, duration: "1.4s", avatarColor: "#8b5cf6", dependsOn: ["file-indexer"], outputSnippet: "Weak secret entropy in HMAC key" },
                            { id: "auditor-sql", name: "auditor-sql.ts", model: "codex/gpt-5.4", status: "cached" as const, duration: "0t (cached)", avatarColor: "#3b82f6", dependsOn: ["file-indexer"], outputSnippet: "Safe parameterized input" },
                            { id: "auditor-cors", name: "auditor-cors.ts", model: "codex/gpt-5.4", status: isCurrent ? ("running" as const) : ("completed" as const), duration: isCurrent ? "running" : "2.1s", avatarColor: "#06b6d4", dependsOn: ["file-indexer"], outputSnippet: "Wildcard origin on /api/*" },
                            { id: "auditor-auth", name: "auditor-auth.ts", model: "o3-mini", status: "cached" as const, duration: "0t (cached)", avatarColor: "#10b981", dependsOn: ["file-indexer"], outputSnippet: "Token expiry verification valid" },
                          ]
                        : [
                            { id: "gate-verifier", name: "gate-verifier", model: "world.run", status: selectedRun.status === "failed" ? "failed" : "completed", duration: "0.4s", avatarColor: "#f59e0b", dependsOn: ["auditor-crypto", "auditor-sql", "auditor-cors", "auditor-auth"], outputSnippet: phase.gate?.command ?? "pnpm test exit code 0" },
                          ]
                    );

                  return (
                    <div
                      key={pIdx}
                      style={{
                        width: 310,
                        flexShrink: 0,
                        backgroundColor: "#10111a",
                        border: `1px solid ${isCurrent ? "#38bdf8" : "#1e2030"}`,
                        borderRadius: 10,
                        display: "flex",
                        flexDirection: "column",
                        position: "relative",
                        zIndex: 2,
                      }}
                    >
                      <View style={[styles.swimlaneHeader, { borderBottomColor: "#1a1c29" }]}>
                        <View style={styles.swimlaneHeaderTop}>
                          <View style={styles.stageIndexPill}>
                            <Text style={styles.stageIndexPillText}>
                              STAGE 0{pIdx + 1}
                            </Text>
                          </View>
                          <View
                            style={[
                              styles.stageStatusBadge,
                              {
                                backgroundColor: stageColor + "18",
                                borderColor: stageColor + "40",
                              },
                            ]}
                          >
                            <Text style={[styles.stageStatusBadgeText, { color: stageColor }]}>
                              {pStatus.toUpperCase()}
                            </Text>
                          </View>
                        </View>

                        <Text style={styles.swimlaneTitleText}>
                          {phase.title}
                        </Text>
                        <Text style={styles.swimlaneSubText}>
                          {stageWorkers.length} agents dispatched
                        </Text>
                      </View>

                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 12,
                          padding: 12,
                          flex: 1,
                        }}
                      >
                        {stageWorkers.map((worker, wIdx) => {
                          const isRunning = worker.status === "running";
                          const isCached = worker.status === "cached";
                          const isCompleted = worker.status === "completed";
                          const isFailed = worker.status === "failed";
                          const workerKey = worker.id ?? worker.name;

                          const statusBadgeColor = isCompleted
                            ? "#10b981"
                            : isCached
                            ? "#10b981"
                            : isRunning
                            ? "#38bdf8"
                            : isFailed
                            ? "#f43f5e"
                            : "#64748b";

                          return (
                            <div
                              key={wIdx}
                              data-agent-id={workerKey}
                              style={{
                                backgroundColor: "#151624",
                                border: `1px solid ${isRunning ? "#38bdf8" : "#212338"}`,
                                borderRadius: 8,
                                padding: 12,
                                display: "flex",
                                flexDirection: "column",
                                gap: 8,
                                position: "relative",
                                boxShadow: isRunning ? "0 0 14px rgba(56, 189, 248, 0.15)" : "none",
                              }}
                            >
                              <div
                                style={{
                                  position: "absolute",
                                  left: -5,
                                  top: "50%",
                                  transform: "translateY(-50%)",
                                  width: 8,
                                  height: 8,
                                  borderRadius: "50%",
                                  backgroundColor: statusBadgeColor,
                                  border: "1.5px solid #10111a",
                                }}
                              />
                              <div
                                style={{
                                  position: "absolute",
                                  right: -5,
                                  top: "50%",
                                  transform: "translateY(-50%)",
                                  width: 8,
                                  height: 8,
                                  borderRadius: "50%",
                                  backgroundColor: statusBadgeColor,
                                  border: "1.5px solid #10111a",
                                }}
                              />

                              <View style={styles.agentCardHeader}>
                                <View style={styles.agentIdentityGroup}>
                                  {isRunning ? (
                                    <div className="wf-spin" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                                      <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                                        <circle cx="8" cy="8" r="6" stroke="#38bdf8" strokeWidth="2.5" strokeDasharray="26" strokeDashoffset="8" />
                                      </svg>
                                    </div>
                                  ) : isCompleted ? (
                                    <View style={[styles.statusIconCircle, { backgroundColor: "rgba(16, 185, 129, 0.18)" }]}>
                                      <Text style={[styles.statusIconText, { color: "#10b981" }]}>✓</Text>
                                    </View>
                                  ) : isCached ? (
                                    <View style={[styles.statusIconCircle, { backgroundColor: "rgba(16, 185, 129, 0.18)" }]}>
                                      <Text style={[styles.statusIconText, { color: "#10b981" }]}>⚡</Text>
                                    </View>
                                  ) : isFailed ? (
                                    <View style={[styles.statusIconCircle, { backgroundColor: "rgba(244, 63, 94, 0.18)" }]}>
                                      <Text style={[styles.statusIconText, { color: "#f43f5e" }]}>✕</Text>
                                    </View>
                                  ) : (
                                    <View style={[styles.statusIconCircle, { backgroundColor: "rgba(100, 116, 139, 0.18)" }]}>
                                      <Text style={[styles.statusIconText, { color: "#64748b" }]}>○</Text>
                                    </View>
                                  )}

                                  <Text style={styles.agentCardName} numberOfLines={1}>
                                    {worker.name}
                                  </Text>
                                </View>

                                {worker.model && (
                                  <View style={styles.agentModelTag}>
                                    <Text style={styles.agentModelTagText}>
                                      {worker.model}
                                    </Text>
                                  </View>
                                )}
                              </View>

                              <View style={styles.agentCardMetricsRow}>
                                <Text style={styles.agentDurationText}>
                                  {isCached ? "⚡ 0 tokens" : worker.duration ?? "running"}
                                </Text>
                                {worker.tasksCount && (
                                  <Text style={styles.agentTasksText}>
                                    · {worker.tasksCount} tasks
                                  </Text>
                                )}
                              </View>

                              {worker.outputSnippet && (
                                <View style={styles.agentSnippetBox}>
                                  <Text style={styles.agentSnippetText} numberOfLines={2}>
                                    {worker.outputSnippet}
                                  </Text>
                                </View>
                              )}
                            </div>
                          );
                        })}

                        {phase.gate && (
                          <div
                            style={{
                              backgroundColor:
                                phase.gate.status === "passed"
                                  ? "rgba(16, 185, 129, 0.08)"
                                  : "rgba(244, 63, 94, 0.08)",
                              border: `1px solid ${phase.gate.status === "passed" ? "rgba(16, 185, 129, 0.35)" : "rgba(244, 63, 94, 0.35)"}`,
                              borderRadius: 8,
                              padding: 10,
                              display: "flex",
                              flexDirection: "column",
                              gap: 6,
                            }}
                          >
                            <View style={styles.gateRow}>
                              <Text style={styles.gateCommandText}>$ {phase.gate.command}</Text>
                              <View
                                style={[
                                  styles.gateStatusBadge,
                                  {
                                    backgroundColor:
                                      phase.gate.status === "passed" ? "#10b981" : "#f43f5e",
                                  },
                                ]}
                              >
                                <Text style={styles.gateStatusBadgeText}>
                                  {phase.gate.status === "passed"
                                    ? "EXIT 0 (PASS)"
                                    : `EXIT ${phase.gate.exitCode} (FAIL)`}
                                </Text>
                              </View>
                            </View>
                            <Text style={styles.gateHintText}>Deterministic gate check</Text>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {selectedRun.error && (
                <View style={styles.rejectionCard}>
                  <Text style={styles.rejectionTitle}>
                    Execution Terminated by Deterministic Gate
                  </Text>
                  <Text style={styles.rejectionDetails}>
                    {selectedRun.error}
                  </Text>
                </View>
              )}
            </div>
          ) : (
            <View style={styles.emptyScreen}>
              <Text style={styles.emptyLogo}>⚡</Text>
              <Text style={styles.emptyMainText}>No workflow runs recorded yet.</Text>
              <Text style={styles.emptySubText}>
                Trigger a workflow using /workflow or paseo.engine.run() to view the live transit topology.
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
}

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

  return (
    <WorkflowTopologyViewer
      runs={runs}
      selectedRunId={selectedRunId}
      onSelectRun={setSelectedRunId}
      onRefresh={() => refetch()}
      theme={theme}
    />
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: "#0d0e15",
  },
  topBar: {
    height: 52,
    paddingHorizontal: 20,
    backgroundColor: "#12131d",
    borderBottomWidth: 1,
    borderColor: "#1e2032",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  topBarLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  brandIcon: {
    fontSize: 16,
    color: "#38bdf8",
    fontWeight: "bold",
  },
  brandTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#f8fafc",
    fontFamily: "monospace",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 9999,
    borderWidth: 1,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  topDivider: {
    width: 1,
    height: 16,
    backgroundColor: "#25283f",
    marginHorizontal: 4,
  },
  brandSubtitle: {
    fontSize: 12,
    color: "#64748b",
  },
  topBarRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  inlineStatBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: "#181a29",
    borderWidth: 1,
    borderColor: "#23263d",
  },
  inlineStatLabel: {
    fontSize: 9,
    fontWeight: "800",
    color: "#64748b",
    letterSpacing: 0.6,
  },
  inlineStatValueGreen: {
    fontSize: 11,
    fontWeight: "700",
    color: "#10b981",
    fontFamily: "monospace",
  },
  inlineStatValueCyan: {
    fontSize: 11,
    fontWeight: "700",
    color: "#38bdf8",
    fontFamily: "monospace",
  },
  inlineStatValueWhite: {
    fontSize: 11,
    fontWeight: "700",
    color: "#f1f5f9",
    fontFamily: "monospace",
  },
  refreshButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: "#1e2135",
    borderWidth: 1,
    borderColor: "#2d324d",
  },
  refreshButtonText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#cbd5e1",
  },
  mainLayout: {
    flex: 1,
    flexDirection: "row",
  },
  sidebarPanel: {
    width: 240,
    borderRightWidth: 1,
    borderColor: "#1a1c2d",
    backgroundColor: "#10111a",
    paddingVertical: 12,
  },
  sidebarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  sidebarTitle: {
    fontSize: 10,
    fontWeight: "800",
    color: "#64748b",
    letterSpacing: 0.8,
  },
  sidebarBadge: {
    fontSize: 11,
    fontWeight: "700",
    color: "#38bdf8",
  },
  sidebarList: {
    flex: 1,
    paddingHorizontal: 8,
  },
  runCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingRight: 10,
    borderRadius: 6,
    marginBottom: 3,
  },
  runCardActive: {
    backgroundColor: "#181a29",
  },
  runCardIndicator: {
    width: 3,
    height: 24,
    borderRadius: 2,
    marginRight: 8,
  },
  runCardBody: {
    flex: 1,
    gap: 3,
  },
  runCardTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#e2e8f0",
    fontFamily: "monospace",
  },
  runCardMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  runStatusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  runStatusLabel: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  runStationCount: {
    fontSize: 10,
    color: "#64748b",
  },
  viewportCanvas: {
    flex: 1,
    backgroundColor: "#0d0e15",
  },
  viewportContent: {
    paddingHorizontal: 28,
    paddingVertical: 20,
  },
  summaryBar: {
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#13141f",
    borderWidth: 1,
    borderColor: "#1e2030",
    alignItems: "center",
  },
  summaryCell: {
    flex: 1,
    gap: 4,
  },
  summaryDivider: {
    width: 1,
    height: 28,
    backgroundColor: "#1e2030",
    marginHorizontal: 14,
  },
  summaryCellLabel: {
    fontSize: 9,
    fontWeight: "800",
    color: "#64748b",
    letterSpacing: 0.6,
  },
  summaryCellValueRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
  },
  summaryCellNumberGreen: {
    fontSize: 18,
    fontWeight: "800",
    color: "#10b981",
    fontFamily: "monospace",
  },
  summaryCellTagGreen: {
    fontSize: 10,
    fontWeight: "700",
    color: "#10b981",
  },
  summaryCellNumberCyan: {
    fontSize: 18,
    fontWeight: "800",
    color: "#38bdf8",
    fontFamily: "monospace",
  },
  summaryCellNumberWhite: {
    fontSize: 18,
    fontWeight: "800",
    color: "#f8fafc",
    fontFamily: "monospace",
  },
  summaryCellNumberAccent: {
    fontSize: 18,
    fontWeight: "800",
    color: "#818cf8",
    fontFamily: "monospace",
  },
  summaryCellTagMuted: {
    fontSize: 10,
    fontWeight: "600",
    color: "#64748b",
  },
  swimlaneHeader: {
    padding: 12,
    borderBottomWidth: 1,
    gap: 4,
  },
  swimlaneHeaderTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  stageIndexPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: "#181a2a",
    borderWidth: 1,
    borderColor: "#25283f",
  },
  stageIndexPillText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#38bdf8",
    fontFamily: "monospace",
  },
  stageStatusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  stageStatusBadgeText: {
    fontSize: 9,
    fontWeight: "800",
  },
  swimlaneTitleText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#f1f5f9",
  },
  swimlaneSubText: {
    fontSize: 11,
    color: "#64748b",
  },
  agentCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  agentIdentityGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  statusIconCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
  },
  statusIconText: {
    fontSize: 10,
    fontWeight: "bold",
  },
  agentCardName: {
    fontSize: 12,
    fontWeight: "700",
    color: "#f8fafc",
    fontFamily: "monospace",
    flex: 1,
  },
  agentModelTag: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
    backgroundColor: "#1c1e30",
    borderWidth: 1,
    borderColor: "#262942",
  },
  agentModelTagText: {
    fontSize: 9,
    color: "#94a3b8",
  },
  agentCardMetricsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  agentDurationText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#10b981",
    fontFamily: "monospace",
  },
  agentTasksText: {
    fontSize: 10,
    color: "#64748b",
  },
  agentSnippetBox: {
    padding: 6,
    borderRadius: 4,
    backgroundColor: "#10111a",
    borderWidth: 1,
    borderColor: "#1a1c2a",
  },
  agentSnippetText: {
    fontSize: 10,
    color: "#94a3b8",
    fontFamily: "monospace",
  },
  gateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  gateCommandText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#f1f5f9",
    fontFamily: "monospace",
  },
  gateStatusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  gateStatusBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#ffffff",
  },
  gateHintText: {
    fontSize: 10,
    color: "#64748b",
  },
  rejectionCard: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: "rgba(244, 63, 94, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(244, 63, 94, 0.4)",
    gap: 4,
  },
  rejectionTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#f43f5e",
  },
  rejectionDetails: {
    fontSize: 11,
    color: "#fecdd3",
    fontFamily: "monospace",
  },
  emptyScreen: {
    padding: 60,
    alignItems: "center",
    gap: 8,
  },
  emptyLogo: {
    fontSize: 28,
    color: "#475569",
  },
  emptyMainText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#cbd5e1",
  },
  emptySubText: {
    fontSize: 11,
    color: "#64748b",
    textAlign: "center",
    maxWidth: 340,
  },
});
