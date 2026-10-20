import type { Meta, StoryObj } from "@storybook/react";
import { WorkflowTimelineCard } from "../client/workflow-card";
import { mockPaseoTheme } from "../.storybook/preview";

const meta: Meta<typeof WorkflowTimelineCard> = {
  title: "Timeline/WorkflowTimelineCard",
  component: WorkflowTimelineCard,
};

export default meta;
type Story = StoryObj<typeof WorkflowTimelineCard>;

export const Running: Story = {
  args: {
    theme: mockPaseoTheme as any,
    layout: { compact: false, platform: "web" },
    agentId: "agent-123",
    timestamp: new Date(),
    item: {
      type: "plugin",
      kind: "workflow-card",
      version: 1,
      data: {
        runId: "dwf-k92a-auth-refactor",
        status: "running",
        currentPhase: "Parallel implementation in worktrees",
        phases: [
          { title: "Discovery & AST call-graph mapping", timestamp: Date.now() - 35000, status: "completed" },
          { title: "Planner ↔ Reviewer architecture convergence", timestamp: Date.now() - 20000, status: "completed", rounds: 2 },
          { title: "Parallel implementation in worktrees", timestamp: Date.now() - 5000, status: "running" },
        ],
        reports: [
          { timestamp: Date.now() - 15000, payload: { planner: "jwt-token-refresh", status: "agreed" } },
          { timestamp: Date.now() - 3000, payload: { worker: "worker-auth", worktree: "wf-branch-auth", status: "started" } },
        ],
        cachedStepsCount: 4,
        liveStepsCount: 2,
      },
    },
  },
};

export const CompletedWithHighCache: Story = {
  args: {
    theme: mockPaseoTheme as any,
    layout: { compact: false, platform: "web" },
    agentId: "agent-123",
    timestamp: new Date(),
    item: {
      type: "plugin",
      kind: "workflow-card",
      version: 1,
      data: {
        runId: "dwf-amend-audit-v2",
        status: "completed",
        currentPhase: "Gate Verification: pnpm test",
        phases: [
          { title: "Find modified TypeScript modules", timestamp: Date.now() - 60000, status: "completed" },
          { title: "Parallel Security Audit (12 files)", timestamp: Date.now() - 40000, status: "completed" },
          { title: "Confirmer validation pass", timestamp: Date.now() - 15000, status: "completed" },
          { title: "Gate Verification: pnpm test", timestamp: Date.now() - 2000, status: "completed" },
        ],
        reports: [
          { timestamp: Date.now() - 38000, payload: { file: "src/auth.ts", severity: "high", issue: "Unvalidated redirect target" } },
          { timestamp: Date.now() - 35000, payload: { file: "src/db.ts", severity: "low", issue: "Implicit connection timeout" } },
          { timestamp: Date.now() - 14000, payload: { confirmer: "reproduced", target: "src/auth.ts", verified: true } },
          { timestamp: Date.now() - 1000, payload: { gateCommand: "pnpm test", exitCode: 0, status: "passed" } },
        ],
        cachedStepsCount: 14,
        liveStepsCount: 2,
        result: {
          passed: true,
          totalAudited: 12,
          findingsConfirmed: 1,
        },
      },
    },
  },
};

export const FailedGate: Story = {
  args: {
    theme: mockPaseoTheme as any,
    layout: { compact: false, platform: "web" },
    agentId: "agent-123",
    timestamp: new Date(),
    item: {
      type: "plugin",
      kind: "workflow-card",
      version: 1,
      data: {
        runId: "dwf-cargo-build-repair",
        status: "failed",
        currentPhase: "Verify with cargo test",
        phases: [
          { title: "Inspect build errors", timestamp: Date.now() - 50000, status: "completed" },
          { title: "Coder agent applies lifetime fix", timestamp: Date.now() - 30000, status: "completed" },
          { title: "Verify with cargo test", timestamp: Date.now() - 10000, status: "failed", rounds: 3 },
        ],
        reports: [
          { timestamp: Date.now() - 10000, payload: { attempt: 3, exitCode: 101, command: "cargo test" } },
        ],
        cachedStepsCount: 1,
        liveStepsCount: 3,
        error: "Deterministic gate rejected after 3 rounds: cargo test exited with code 101: borrow checker error E0502",
      },
    },
  },
};
