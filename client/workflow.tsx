import type { PluginScreenProps } from "@getpaseo/plugin/client";
import { useRpc } from "@getpaseo/plugin/client";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Pressable, Text, View, ScrollView, TextInput } from "react-native";
import { listWorkflowsRpc, runWorkflowRpc } from "../shared/contracts";

export function WorkflowScreen({ theme, layout }: PluginScreenProps) {
  const [scriptPath, setScriptPath] = useState("");
  const listWorkflows = useRpc(listWorkflowsRpc);
  const runWorkflow = useRpc(runWorkflowRpc);

  const workflowsQuery = useQuery({
    queryKey: ["workflows"],
    queryFn: () => listWorkflows({ limit: 20 }),
  });

  const runMutation = useMutation({
    mutationFn: runWorkflow,
    onSuccess: () => {
      workflowsQuery.refetch();
    },
  });

  const styles = useMemo(
    () => ({
      container: {
        flex: 1,
        padding: layout.compact ? 16 : 24,
        backgroundColor: theme.colors.surface0,
      },
      title: {
        fontSize: 20,
        fontWeight: "bold" as const,
        color: theme.colors.foreground,
        marginBottom: 16,
      },
      card: {
        padding: 16,
        borderRadius: 8,
        backgroundColor: theme.colors.surface1,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: theme.colors.border,
      },
      text: {
        color: theme.colors.foreground,
        fontSize: 14,
      },
      dimText: {
        color: theme.colors.foregroundMuted,
        fontSize: 12,
        marginTop: 4,
      },
      badge: {
        alignSelf: "flex-start" as const,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        marginBottom: 8,
      },
      input: {
        padding: 10,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: theme.colors.border,
        color: theme.colors.foreground,
        backgroundColor: theme.colors.surface1,
        marginBottom: 10,
      },
      button: {
        padding: 12,
        borderRadius: 6,
        backgroundColor: theme.colors.accent,
        alignItems: "center" as const,
        marginBottom: 20,
      },
      buttonText: {
        color: theme.colors.accentForeground,
        fontWeight: "600" as const,
      },
    }),
    [theme, layout.compact]
  );

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Dynamic Workflows</Text>

      <TextInput
        style={styles.input}
        placeholder="Enter workflow script path (e.g. .paseo/workflow.ts)"
        placeholderTextColor={theme.colors.foregroundMuted}
        value={scriptPath}
        onChangeText={setScriptPath}
      />

      <Pressable
        style={styles.button}
        onPress={() => {
          if (scriptPath.trim()) {
            runMutation.mutate({
              path: scriptPath.trim(),
              cwd: ".",
            });
          }
        }}
      >
        <Text style={styles.buttonText}>
          {runMutation.isPending ? "Running..." : "Run Workflow"}
        </Text>
      </Pressable>

      <Text style={[styles.title, { fontSize: 16 }]}>Recent Runs</Text>

      {workflowsQuery.data?.map((wf) => (
        <View key={wf.runId} style={styles.card}>
          <Text style={[styles.text, { fontWeight: "bold" }]}>
            {wf.runId} - {wf.status.toUpperCase()}
          </Text>
          {wf.currentPhase && (
            <Text style={styles.text}>Phase: {wf.currentPhase}</Text>
          )}
          <Text style={styles.dimText}>
            Cached steps: {wf.cachedStepsCount} | Live steps: {wf.liveStepsCount}
          </Text>
          {wf.error && (
            <Text style={[styles.text, { color: theme.colors.statusDanger, marginTop: 4 }]}>
              Error: {wf.error}
            </Text>
          )}
        </View>
      ))}
    </ScrollView>
  );
}
