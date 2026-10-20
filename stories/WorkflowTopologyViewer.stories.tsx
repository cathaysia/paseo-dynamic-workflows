import type { Meta, StoryObj } from "@storybook/react";
import { WorkflowTopologyViewer } from "../client/workflow-panel";
import { mockPaseoTheme } from "../.storybook/preview";
import type { WorkflowRunStatus } from "../shared/types";

const meta: Meta<typeof WorkflowTopologyViewer> = {
  title: "Workspace/WorkflowTopologyViewer",
  component: WorkflowTopologyViewer,
};

export default meta;
type Story = StoryObj<typeof WorkflowTopologyViewer>;

const mockRuns: WorkflowRunStatus[] = [
  {
    runId: "dwf-fanout-security-scan",
    status: "running",
    startedAt: Date.now() - 70000,
    currentPhase: "Parallel Vulnerability Audit (12 workers)",
    phases: [
      { title: "AST File Discovery & Dependency Slicing", timestamp: Date.now() - 65000 },
      { title: "Parallel Vulnerability Audit (12 workers)", timestamp: Date.now() - 30000 },
      { title: "Deterministic Validation Gate: pnpm test", timestamp: Date.now() - 5000 },
    ],
    reports: [
      { timestamp: Date.now() - 25000, payload: { worker: "agent-crypto", target: "src/jwt.ts", finding: "Weak secret entropy" } },
      { timestamp: Date.now() - 20000, payload: { worker: "agent-sql", target: "src/query.ts", finding: "Safe parametrized input" } },
      { timestamp: Date.now() - 15000, payload: { worker: "agent-cors", target: "src/server.ts", finding: "Wildcard origin warning" } },
      { timestamp: Date.now() - 8000, payload: { cacheEngine: "sqlite", hitRatio: "75%", tokensSaved: 14200 } },
    ],
    cachedStepsCount: 8,
    liveStepsCount: 4,
  },
  {
    runId: "dwf-planner-reviewer-debate",
    status: "completed",
    startedAt: Date.now() - 200000,
    completedAt: Date.now() - 5000,
    currentPhase: "Gate Approval: Consensus Reached",
    phases: [
      { title: "Architecture Proposal by Planner", timestamp: Date.now() - 180000 },
      { title: "Critique & Edge Cases by Reviewer", timestamp: Date.now() - 120000 },
      { title: "Consensus Loop Round 2", timestamp: Date.now() - 60000 },
      { title: "Gate Approval: Consensus Reached", timestamp: Date.now() - 10000 },
    ],
    reports: [
      { timestamp: Date.now() - 110000, payload: { round: 1, reviewerScore: 6, feedback: "Missing rollback handling" } },
      { timestamp: Date.now() - 50000, payload: { round: 2, reviewerScore: 9, feedback: "Rollback transaction logic verified" } },
      { timestamp: Date.now() - 10000, payload: { gate: "consensus", approved: true } },
    ],
    cachedStepsCount: 16,
    liveStepsCount: 2,
    result: {
      status: "approved",
      rounds: 2,
    },
  },
  {
    runId: "dwf-cargo-test-verify",
    status: "failed",
    startedAt: Date.now() - 250000,
    completedAt: Date.now() - 100000,
    currentPhase: "Deterministic Gate Check",
    phases: [
      { title: "Generate Rust FFI Bindings", timestamp: Date.now() - 240000 },
      { title: "Apply Lifetime annotations", timestamp: Date.now() - 180000 },
      { title: "Deterministic Gate Check", timestamp: Date.now() - 120000 },
    ],
    reports: [
      { timestamp: Date.now() - 120000, payload: { attempt: 3, exitCode: 101, error: "E0502: cannot borrow *self as mutable" } },
    ],
    cachedStepsCount: 2,
    liveStepsCount: 3,
    error: "Deterministic gate rejected after 3 rounds: cargo test exited with code 101",
  },
];

export const ActiveParallelWorkflow: Story = {
  args: {
    theme: mockPaseoTheme as any,
    runs: mockRuns,
    selectedRunId: "dwf-fanout-security-scan",
  },
};

export const CompletedFullPipeline: Story = {
  args: {
    theme: mockPaseoTheme as any,
    runs: mockRuns,
    selectedRunId: "dwf-planner-reviewer-debate",
  },
};

export const EmptyState: Story = {
  args: {
    theme: mockPaseoTheme as any,
    runs: [],
    selectedRunId: null,
  },
};
