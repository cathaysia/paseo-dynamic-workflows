import type { PluginTimelineItemProps } from "@getpaseo/plugin/client";
import { useRpc } from "@getpaseo/plugin/client";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import type { WorkflowTimelineData } from "../shared/timeline";
import type { WorkflowWorkerItem } from "../shared/types";
import {
  cancelWorkflowRpc,
  retryAgentRpc,
  deleteWorkflowRpc,
} from "../shared/contracts";

interface NodePosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface WorkerEdge {
  fromId: string;
  toId: string;
  fromStatus: string;
  toStatus: string;
}

export interface WorkflowTimelineCardProps {
  item: {
    type?: string;
    kind?: string;
    version?: number;
    data: WorkflowTimelineData;
  };
  theme?: any;
  layout?: any;
  agentId?: string;
  timestamp?: Date;
  host?: any;
}

export function WorkflowTimelineCard({
  item,
  theme,
}: WorkflowTimelineCardProps) {
  const data = item.data;
  const swimlanesRef = useRef<any>(null);
  const [nodePositions, setNodePositions] = useState<Record<string, NodePosition>>({});
  const cancelWorkflow = useRpc(cancelWorkflowRpc);
  const retryAgent = useRpc(retryAgentRpc);
  const deleteWorkflow = useRpc(deleteWorkflowRpc);
  const [isActing, setIsActing] = useState(false);

  const handleCancel = useCallback(async () => {
    if (isActing) return;
    setIsActing(true);
    try {
      await cancelWorkflow({ runId: data.runId });
    } catch (e) {
      console.warn(e);
    } finally {
      setIsActing(false);
    }
  }, [cancelWorkflow, isActing, data.runId]);

  const handleRetryAgent = useCallback(async (agentName: string) => {
    if (isActing) return;
    setIsActing(true);
    try {
      await retryAgent({ runId: data.runId, agentName });
    } catch (e) {
      console.warn(e);
    } finally {
      setIsActing(false);
    }
  }, [retryAgent, isActing, data.runId]);

  const handleDelete = useCallback(async () => {
    if (isActing) return;
    setIsActing(true);
    try {
      await deleteWorkflow({ runId: data.runId });
    } catch (e) {
      console.warn(e);
    } finally {
      setIsActing(false);
    }
  }, [deleteWorkflow, isActing, data.runId]);

  const statusColor = useMemo(() => {
    switch (data.status) {
      case "completed":
        return "#10b981";
      case "failed":
        return "#f43f5e";
      case "cancelled":
        return "#f59e0b";
      case "running":
        return "#38bdf8";
      default:
        return "#64748b";
    }
  }, [data.status]);

  const allWorkers = useMemo(() => {
    const list: WorkflowWorkerItem[] = [];
    (data.phases ?? []).forEach((phase, pIdx) => {
      const isCurrent = data.currentPhase === phase.title;
      const stageWorkers =
        phase.workers && phase.workers.length > 0
          ? phase.workers
          : [
              {
                id: `stage-${pIdx}`,
                name: phase.title,
                status: phase.status ?? (isCurrent ? "running" : "completed"),
                duration: "auto",
              },
            ];
      list.push(...stageWorkers);
    });
    return list;
  }, [data.phases, data.currentPhase]);

  const edges = useMemo(() => {
    const result: WorkerEdge[] = [];
    const workerMap = new Map<string, WorkflowWorkerItem>();

    allWorkers.forEach((w) => {
      const key = w.id ?? w.name;
      workerMap.set(key, w);
    });

    allWorkers.forEach((worker) => {
      const toId = worker.id ?? worker.name;
      if (worker.dependsOn && Array.isArray(worker.dependsOn)) {
        worker.dependsOn.forEach((depId) => {
          const fromWorker = workerMap.get(depId);
          result.push({
            fromId: depId,
            toId,
            fromStatus: fromWorker?.status ?? "completed",
            toStatus: worker.status,
          });
        });
      }
    });

    return result;
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
    const timer = setTimeout(updateNodePositions, 80);
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
  }, [data, allWorkers]);

  return (
    <View
      style={[
        styles.cardContainer,
        {
          backgroundColor: theme?.colors?.surface1 ?? "#12131d",
          borderColor: theme?.colors?.border ?? "#1e2030",
        },
      ]}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <Text style={[styles.cardIcon, { color: theme?.colors?.accent ?? "#38bdf8" }]}>⚡</Text>
          <View style={styles.cardTitleCol}>
            <Text style={[styles.cardTitle, { color: theme?.colors?.foreground ?? "#f1f5f9" }]}>
              {data.runId}
            </Text>
            <Text
              style={[styles.cardSubtitle, { color: theme?.colors?.foregroundMuted ?? "#64748b" }]}
              numberOfLines={1}
            >
              {data.currentPhase ?? "Dynamic Workflow"}
            </Text>
          </View>
        </View>

        <View style={styles.cardHeaderRight}>
          {data.cachedStepsCount > 0 && (
            <View style={styles.cachePill}>
              <Text style={styles.cachePillText}>
                ⚡ {data.cachedStepsCount} cached
              </Text>
            </View>
          )}
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: statusColor + "18",
                borderColor: statusColor + "40",
              },
            ]}
          >
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusBadgeText, { color: statusColor }]}>
              {data.status.toUpperCase()}
            </Text>
          </View>

          {data.status === "running" ? (
            <Pressable style={styles.actionBtnCancel} onPress={handleCancel}>
              <Text style={styles.actionBtnCancelText}>⏹ Stop</Text>
            </Pressable>
          ) : (
            <Pressable style={styles.actionBtnDelete} onPress={handleDelete}>
              <Text style={styles.actionBtnDeleteText}>✕ Delete</Text>
            </Pressable>
          )}
        </View>
      </View>

      <ScrollView
        style={styles.swimlanesScroll}
        contentContainerStyle={styles.swimlanesScrollContent}
        horizontal
        showsHorizontalScrollIndicator={true}
      >
        <div
          ref={swimlanesRef}
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "row",
            gap: 24,
            paddingTop: 6,
            paddingBottom: 14,
            minWidth: "100%",
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
              <marker id="wf-edge-cyan" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                <path d="M 0 0 L 6 3 L 0 6 z" fill="#38bdf8" />
              </marker>
              <marker id="wf-edge-green" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                <path d="M 0 0 L 6 3 L 0 6 z" fill="#10b981" />
              </marker>
              <marker id="wf-edge-rose" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                <path d="M 0 0 L 6 3 L 0 6 z" fill="#f43f5e" />
              </marker>
              <marker id="wf-edge-gray" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                <path d="M 0 0 L 6 3 L 0 6 z" fill="#475569" />
              </marker>
            </defs>

            {edges.map((edge, eIdx) => {
              const fromPos = nodePositions[edge.fromId];
              const toPos = nodePositions[edge.toId];
              if (!fromPos || !toPos) return null;

              const x1 = fromPos.x + fromPos.width;
              const y1 = fromPos.y + fromPos.height / 2;
              const x2 = toPos.x;
              const y2 = toPos.y + toPos.height / 2;

              const dx = Math.max(14, (x2 - x1) / 2);
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
                ? "wf-edge-cyan"
                : isFailedEdge
                ? "wf-edge-rose"
                : isCompletedEdge
                ? "wf-edge-green"
                : "wf-edge-gray";

              return (
                <g key={eIdx}>
                  <path
                    d={pathData}
                    stroke={edgeColor}
                    strokeWidth={1.5}
                    strokeDasharray={isRunningEdge ? "4 2" : undefined}
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

          {(data.phases ?? []).map((phase, pIdx) => {
            const isCurrent = data.currentPhase === phase.title;
            const isLast = pIdx === (data.phases?.length ?? 0) - 1;
            const pStatus =
              phase.status ??
              (isCurrent
                ? "running"
                : data.status === "failed" && isLast
                ? "failed"
                : "completed");

            const stageWorkers: WorkflowWorkerItem[] =
              phase.workers && phase.workers.length > 0
                ? phase.workers
                : [
                    {
                      id: `stage-${pIdx}`,
                      name: phase.title,
                      status: pStatus as any,
                      duration: "auto",
                    },
                  ];

            return (
              <div
                key={pIdx}
                style={{
                  width: 215,
                  flexShrink: 0,
                  backgroundColor: "#0d0e15",
                  border: `1px solid ${isCurrent ? "#38bdf8" : "#1e2030"}`,
                  borderRadius: 8,
                  display: "flex",
                  flexDirection: "column",
                  position: "relative",
                  zIndex: 2,
                }}
              >
                <View style={styles.stageHeader}>
                  <Text style={styles.stageTitleText} numberOfLines={1}>
                    {phase.title}
                  </Text>
                </View>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                    padding: 8,
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
                          borderRadius: 6,
                          padding: 8,
                          display: "flex",
                          flexDirection: "column",
                          gap: 6,
                          position: "relative",
                          boxShadow: isRunning ? "0 0 10px rgba(56, 189, 248, 0.15)" : "none",
                        }}
                      >
                        <div
                          style={{
                            position: "absolute",
                            left: -4,
                            top: "50%",
                            transform: "translateY(-50%)",
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            backgroundColor: statusBadgeColor,
                            border: "1px solid #10111a",
                          }}
                        />
                        <div
                          style={{
                            position: "absolute",
                            right: -4,
                            top: "50%",
                            transform: "translateY(-50%)",
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            backgroundColor: statusBadgeColor,
                            border: "1px solid #10111a",
                          }}
                        />

                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 4,
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                              minWidth: 0,
                              flex: 1,
                            }}
                          >
                            {isRunning ? (
                              <div
                                className="wf-spin"
                                style={{
                                  width: 11,
                                  height: 11,
                                  borderRadius: "50%",
                                  border: "1.5px solid rgba(56, 189, 248, 0.25)",
                                  borderTopColor: "#38bdf8",
                                  flexShrink: 0,
                                }}
                              />
                            ) : isCompleted ? (
                              <span style={{ color: "#10b981", fontSize: 11, fontWeight: "bold", flexShrink: 0 }}>
                                ✓
                              </span>
                            ) : isCached ? (
                              <span style={{ color: "#10b981", fontSize: 10, fontWeight: "bold", flexShrink: 0 }}>
                                ⚡
                              </span>
                            ) : isFailed ? (
                              <span style={{ color: "#f43f5e", fontSize: 11, fontWeight: "bold", flexShrink: 0 }}>
                                ✕
                              </span>
                            ) : (
                              <span style={{ color: "#64748b", fontSize: 10, flexShrink: 0 }}>○</span>
                            )}
                            <span
                              style={{
                                fontSize: 10.5,
                                fontWeight: 700,
                                color: "#f1f5f9",
                                fontFamily: "monospace",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {worker.name}
                            </span>
                          </div>

                          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            {worker.model && (
                              <span
                                style={{
                                  fontSize: 8,
                                  color: "#94a3b8",
                                  backgroundColor: "#1c1d2e",
                                  padding: "1px 4px",
                                  borderRadius: 3,
                                  fontFamily: "monospace",
                                  flexShrink: 0,
                                }}
                              >
                                {worker.model}
                              </span>
                            )}
                            <Pressable
                              style={styles.retryNodeBtn}
                              onPress={() => handleRetryAgent(worker.name)}
                            >
                              <Text style={styles.retryNodeBtnText}>↻</Text>
                            </Pressable>
                          </div>
                        </div>

                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            fontSize: 8.5,
                          }}
                        >
                          <span style={{ color: statusBadgeColor }}>
                            {isRunning ? "running" : isCached ? "cached (0t)" : worker.duration ?? "done"}
                          </span>
                          {worker.worktree && (
                            <span style={{ color: "#64748b", fontFamily: "monospace" }}>
                              git:{worker.worktree}
                            </span>
                          )}
                        </div>

                        {worker.outputSnippet && (
                          <div
                            style={{
                              backgroundColor: "#090a10",
                              padding: "4px 6px",
                              borderRadius: 4,
                              fontSize: 8.5,
                              color: "#94a3b8",
                              fontFamily: "monospace",
                              lineHeight: 1.3,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {worker.outputSnippet}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollView>

      {data.error && (
        <View style={styles.rejectionCard}>
          <View style={styles.rejectionCardTop}>
            <Text style={styles.rejectionTitle}>
              Execution Terminated by Deterministic Gate
            </Text>
            <Pressable style={styles.rejectionRetryBtn} onPress={() => handleRetryAgent("")}>
              <Text style={styles.rejectionRetryBtnText}>↻ Retry Run</Text>
            </Pressable>
          </View>
          <Text style={styles.rejectionDetails}>{data.error}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    marginVertical: 6,
    gap: 10,
    maxWidth: "100%",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
    minWidth: 0,
  },
  cardIcon: {
    fontSize: 14,
    fontWeight: "bold",
  },
  cardTitleCol: {
    gap: 1,
    flex: 1,
    minWidth: 0,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: "700",
    fontFamily: "monospace",
  },
  cardSubtitle: {
    fontSize: 10,
  },
  cardHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  cachePill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: "rgba(16, 185, 129, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.3)",
  },
  cachePillText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#10b981",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusBadgeText: {
    fontSize: 8.5,
    fontWeight: "800",
  },
  actionBtnCancel: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: "rgba(244, 63, 94, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(244, 63, 94, 0.4)",
  },
  actionBtnCancelText: {
    fontSize: 8.5,
    fontWeight: "700",
    color: "#f43f5e",
  },
  actionBtnDelete: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: "rgba(100, 116, 139, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(100, 116, 139, 0.3)",
  },
  actionBtnDeleteText: {
    fontSize: 8.5,
    fontWeight: "700",
    color: "#94a3b8",
  },
  retryNodeBtn: {
    width: 16,
    height: 16,
    borderRadius: 3,
    backgroundColor: "#1c1d2e",
    borderWidth: 1,
    borderColor: "#2a2d44",
    alignItems: "center",
    justifyContent: "center",
  },
  retryNodeBtnText: {
    fontSize: 9,
    color: "#38bdf8",
    fontWeight: "bold",
    lineHeight: 12,
  },
  swimlanesScroll: {
    width: "100%",
  },
  swimlanesScrollContent: {
    paddingVertical: 2,
  },
  stageHeader: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#1a1c29",
  },
  stageTitleText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#f1f5f9",
  },
  rejectionCard: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: "rgba(244, 63, 94, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(244, 63, 94, 0.4)",
    gap: 4,
  },
  rejectionCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rejectionTitle: {
    fontSize: 10.5,
    fontWeight: "800",
    color: "#f43f5e",
  },
  rejectionRetryBtn: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: "rgba(244, 63, 94, 0.2)",
    borderWidth: 1,
    borderColor: "rgba(244, 63, 94, 0.5)",
  },
  rejectionRetryBtnText: {
    fontSize: 8.5,
    fontWeight: "800",
    color: "#fecdd3",
  },
  rejectionDetails: {
    fontSize: 9.5,
    color: "#fecdd3",
    fontFamily: "monospace",
  },
});
