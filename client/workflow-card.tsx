import type { PluginTimelineItemProps } from "@getpaseo/plugin/client";
import { useMemo, useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import type { WorkflowTimelineData } from "../shared/timeline";

export function WorkflowTimelineCard({
  item,
  theme,
}: PluginTimelineItemProps<WorkflowTimelineData>) {
  const data = item.data;
  const [showLogs, setShowLogs] = useState(false);

  const statusColor = useMemo(() => {
    switch (data.status) {
      case "completed":
        return theme.colors.statusSuccess;
      case "failed":
        return theme.colors.statusDanger;
      case "running":
        return "#38bdf8";
      default:
        return theme.colors.foregroundMuted;
    }
  }, [data.status, theme.colors]);

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface1,
          borderColor: theme.colors.border,
        },
      ]}
    >
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={[styles.workflowIcon, { color: theme.colors.accent }]}>⚡</Text>
          <View style={styles.titleMeta}>
            <View style={styles.runIdRow}>
              <Text style={[styles.title, { color: theme.colors.foreground }]}>
                Dynamic Workflow
              </Text>
              <Text style={[styles.runIdBadge, { color: theme.colors.foregroundMuted }]}>
                {data.runId}
              </Text>
            </View>
            <Text style={[styles.subtitle, { color: theme.colors.foregroundMuted }]}>
              {data.currentPhase ?? "Orchestrating subagents"}
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.statusLampBadge,
            {
              backgroundColor: statusColor + "18",
              borderColor: statusColor + "44",
            },
          ]}
        >
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusText, { color: statusColor }]}>
            {data.status.toUpperCase()}
          </Text>
        </View>
      </View>

      <View
        style={[
          styles.statStrip,
          {
            backgroundColor: theme.colors.surface0,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <Text style={[styles.statItem, { color: theme.colors.statusSuccess }]}>
          ⚡ {data.cachedStepsCount} cached (0 token)
        </Text>
        <Text style={[styles.statDividerText, { color: theme.colors.border }]}>|</Text>
        <Text style={[styles.statItem, { color: "#38bdf8" }]}>
          🔄 {data.liveStepsCount} live executions
        </Text>
        <Text style={[styles.statDividerText, { color: theme.colors.border }]}>|</Text>
        <Text style={[styles.statItem, { color: theme.colors.foregroundMuted }]}>
          📊 {data.phases.length} stations
        </Text>
      </View>

      {data.phases && data.phases.length > 0 && (
        <View style={styles.metroSection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.foregroundMuted }]}>
            TRANSIT STATIONS
          </Text>

          <View style={styles.metroList}>
            {data.phases.map((phase, idx) => {
              const isCurrent = data.currentPhase === phase.title;
              const isLast = idx === data.phases.length - 1;
              const isFailed = data.status === "failed" && isLast;
              const lampColor = isFailed
                ? theme.colors.statusDanger
                : isCurrent
                ? "#38bdf8"
                : theme.colors.statusSuccess;

              return (
                <View key={idx} style={styles.stationRow}>
                  <View style={styles.stationSpine}>
                    <View
                      style={[
                        styles.stationLamp,
                        {
                          backgroundColor: lampColor,
                          borderColor: lampColor + "44",
                        },
                      ]}
                    />
                    {!isLast && (
                      <View
                        style={[
                          styles.stationTrackLine,
                          {
                            backgroundColor: isCurrent ? "#38bdf8" + "66" : theme.colors.border,
                          },
                        ]}
                      />
                    )}
                  </View>

                  <View style={styles.stationInfo}>
                    <Text
                      style={[
                        styles.stationTitle,
                        {
                          color: isCurrent ? theme.colors.foreground : theme.colors.foregroundMuted,
                          fontWeight: isCurrent ? "700" : "500",
                        },
                      ]}
                    >
                      0{idx + 1}. {phase.title}
                    </Text>
                    {phase.rounds && phase.rounds > 1 && (
                      <Text style={[styles.roundsText, { color: theme.colors.accent }]}>
                        ⟳ {phase.rounds} rounds
                      </Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {data.error && (
        <View
          style={[
            styles.errorBanner,
            {
              backgroundColor: theme.colors.statusDanger + "15",
              borderColor: theme.colors.statusDanger,
            },
          ]}
        >
          <Text style={[styles.errorHeading, { color: theme.colors.statusDanger }]}>
            Deterministic Gate Rejected
          </Text>
          <Text style={[styles.errorDetail, { color: theme.colors.foreground }]}>
            {data.error}
          </Text>
        </View>
      )}

      {data.reports && data.reports.length > 0 && (
        <View style={styles.telemetryDrawer}>
          <Pressable
            style={styles.telemetryToggle}
            onPress={() => setShowLogs(!showLogs)}
          >
            <Text style={[styles.telemetryToggleText, { color: theme.colors.foregroundMuted }]}>
              {showLogs ? "▴ Hide Telemetry Events" : `▾ Show Telemetry Stream (${data.reports.length} events)`}
            </Text>
          </Pressable>

          {showLogs && (
            <View
              style={[
                styles.terminalBox,
                {
                  backgroundColor: "#0d0e15",
                  borderColor: theme.colors.border,
                },
              ]}
            >
              {data.reports.slice(-5).map((rep, idx) => (
                <View key={idx} style={styles.terminalRow}>
                  <Text style={styles.terminalTime}>
                    {new Date(rep.timestamp).toLocaleTimeString()}
                  </Text>
                  <Text style={styles.terminalArrow}>❯</Text>
                  <Text style={styles.terminalJson} numberOfLines={2}>
                    {typeof rep.payload === "string" ? rep.payload : JSON.stringify(rep.payload)}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginVertical: 8,
    gap: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    flex: 1,
  },
  workflowIcon: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 2,
  },
  titleMeta: {
    gap: 2,
    flex: 1,
  },
  runIdRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: "700",
  },
  runIdBadge: {
    fontSize: 11,
    fontFamily: "monospace",
  },
  subtitle: {
    fontSize: 12,
  },
  statusLampBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
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
  },
  statStrip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  statItem: {
    fontSize: 11,
    fontWeight: "600",
  },
  statDividerText: {
    fontSize: 11,
  },
  metroSection: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  metroList: {
    gap: 0,
  },
  stationRow: {
    flexDirection: "row",
    minHeight: 28,
  },
  stationSpine: {
    width: 20,
    alignItems: "center",
    position: "relative",
  },
  stationLamp: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    marginTop: 4,
    zIndex: 2,
  },
  stationTrackLine: {
    position: "absolute",
    top: 14,
    bottom: -4,
    width: 2,
    zIndex: 1,
  },
  stationInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingLeft: 8,
    paddingBottom: 8,
  },
  stationTitle: {
    fontSize: 12,
  },
  roundsText: {
    fontSize: 10,
    fontWeight: "700",
  },
  errorBanner: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
  },
  errorHeading: {
    fontSize: 11,
    fontWeight: "800",
  },
  errorDetail: {
    fontSize: 11,
    fontFamily: "monospace",
  },
  telemetryDrawer: {
    gap: 6,
  },
  telemetryToggle: {
    paddingVertical: 2,
  },
  telemetryToggleText: {
    fontSize: 11,
    fontWeight: "600",
  },
  terminalBox: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
  },
  terminalRow: {
    flexDirection: "row",
    gap: 6,
    paddingVertical: 2,
  },
  terminalTime: {
    color: "#475569",
    fontSize: 10,
    fontFamily: "monospace",
  },
  terminalArrow: {
    color: "#38bdf8",
    fontSize: 10,
    fontFamily: "monospace",
  },
  terminalJson: {
    flex: 1,
    color: "#94a3b8",
    fontSize: 10,
    fontFamily: "monospace",
  },
});
