import type { PluginTimelineItemProps } from "@getpaseo/plugin/client";
import { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import type { WorkflowTimelineData } from "../shared/timeline";

export function WorkflowTimelineCard({
  item,
  theme,
}: PluginTimelineItemProps<WorkflowTimelineData>) {
  const data = item.data;

  const statusColor = useMemo(() => {
    switch (data.status) {
      case "completed":
        return theme.colors.statusSuccess;
      case "failed":
        return theme.colors.statusDanger;
      case "running":
        return theme.colors.accent;
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
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: theme.colors.foreground }]}>
            ⚡ Dynamic Workflow
          </Text>
          <Text style={[styles.runId, { color: theme.colors.foregroundMuted }]}>
            {data.runId}
          </Text>
        </View>

        <View style={[styles.statusBadge, { backgroundColor: statusColor + "22", borderColor: statusColor }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>
            {data.status.toUpperCase()}
          </Text>
        </View>
      </View>

      {/* Stats Bar */}
      <View
        style={[
          styles.statsRow,
          {
            backgroundColor: theme.colors.surface2,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <Text style={[styles.statItem, { color: theme.colors.statusSuccess }]}>
          ⚡ {data.cachedStepsCount} steps cached (0 token)
        </Text>
        <Text style={[styles.statItem, { color: theme.colors.foreground }]}>
          🔄 {data.liveStepsCount} live steps
        </Text>
      </View>

      {/* Phases Stepper / Timeline */}
      {data.phases && data.phases.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.foregroundMuted }]}>
            EXECUTION PHASES
          </Text>
          <View style={styles.phasesList}>
            {data.phases.map((phase, idx) => {
              const isCurrent = data.currentPhase === phase.title;
              return (
                <View key={idx} style={styles.phaseRow}>
                  <View
                    style={[
                      styles.phaseDot,
                      {
                        backgroundColor: isCurrent
                          ? theme.colors.accent
                          : theme.colors.statusSuccess,
                      },
                    ]}
                  />
                  <Text
                    style={[
                      styles.phaseText,
                      {
                        color: isCurrent
                          ? theme.colors.accent
                          : theme.colors.foreground,
                        fontWeight: isCurrent ? "700" : "500",
                      },
                    ]}
                  >
                    {idx + 1}. {phase.title}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* Live Streamed Reports */}
      {data.reports && data.reports.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.foregroundMuted }]}>
            LIVE REPORTS ({data.reports.length})
          </Text>
          <View
            style={[
              styles.reportsBox,
              {
                backgroundColor: theme.colors.surface0,
                borderColor: theme.colors.border,
              },
            ]}
          >
            {data.reports.slice(-5).map((rep, idx) => (
              <View key={idx} style={styles.reportRow}>
                <Text
                  style={[styles.reportCode, { color: theme.colors.foreground }]}
                  numberOfLines={2}
                >
                  {typeof rep.payload === "string"
                    ? rep.payload
                    : JSON.stringify(rep.payload)}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Error display */}
      {data.error && (
        <View
          style={[
            styles.errorBox,
            {
              backgroundColor: theme.colors.statusDanger + "15",
              borderColor: theme.colors.statusDanger,
            },
          ]}
        >
          <Text style={[styles.errorText, { color: theme.colors.statusDanger }]}>
            {data.error}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 16,
    marginVertical: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: "bold",
  },
  runId: {
    fontSize: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    marginBottom: 12,
  },
  statItem: {
    fontSize: 12,
    fontWeight: "600",
  },
  section: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  phasesList: {
    gap: 6,
  },
  phaseRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  phaseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  phaseText: {
    fontSize: 13,
  },
  reportsBox: {
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    gap: 4,
  },
  reportRow: {
    paddingVertical: 2,
  },
  reportCode: {
    fontSize: 11,
    fontFamily: "monospace",
  },
  errorBox: {
    marginTop: 10,
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
  },
  errorText: {
    fontSize: 12,
  },
});
