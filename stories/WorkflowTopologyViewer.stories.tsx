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
    startedAt: Date.now() - 72000,
    currentPhase: "Parallel Implementation & Audit",
    phases: [
      {
        title: "Discovery & Topology Planning",
        timestamp: Date.now() - 65000,
        status: "completed",
        workers: [
          {
            id: "planner",
            name: "planner-architect",
            model: "claude-3-7-sonnet",
            status: "completed",
            duration: "1.2s",
            avatarColor: "#8b5cf6",
            tasksCount: 2,
            outputSnippet: "Discovered 12 TypeScript source modules & sliced dependency graph",
          },
        ],
      },
      {
        title: "Parallel Implementation & Audit",
        timestamp: Date.now() - 30000,
        status: "running",
        workers: [
          {
            id: "worker-crypto",
            name: "auditor-crypto.ts",
            model: "claude-3-7-sonnet",
            status: "completed",
            duration: "1.4s",
            avatarColor: "#a855f7",
            dependsOn: ["planner"],
            tasksCount: 4,
            outputSnippet: "Weak secret entropy in HMAC key generation",
            worktree: "branch-crypto",
          },
          {
            id: "worker-sql",
            name: "auditor-sql.ts",
            model: "codex/gpt-5.4",
            status: "cached",
            duration: "0t (cached)",
            avatarColor: "#3b82f6",
            dependsOn: ["planner"],
            tasksCount: 3,
            outputSnippet: "Safe parameterized input verified",
            worktree: "branch-sql",
          },
          {
            id: "worker-cors",
            name: "auditor-cors.ts",
            model: "codex/gpt-5.4",
            status: "running",
            duration: "running",
            avatarColor: "#06b6d4",
            dependsOn: ["planner"],
            tasksCount: 2,
            outputSnippet: "Auditing wildcard CORS origins on /api/*",
            worktree: "branch-cors",
          },
          {
            id: "worker-auth",
            name: "auditor-auth.ts",
            model: "o3-mini",
            status: "cached",
            duration: "0t (cached)",
            avatarColor: "#10b981",
            dependsOn: ["planner"],
            tasksCount: 5,
            outputSnippet: "JWT token expiry check verified",
            worktree: "branch-auth",
          },
        ],
      },
      {
        title: "Cross-Review & Consensus",
        timestamp: Date.now() - 15000,
        status: "running",
        rounds: 2,
        workers: [
          {
            id: "reviewer",
            name: "reviewer-audit",
            model: "o3-mini",
            status: "running",
            duration: "running",
            avatarColor: "#f59e0b",
            dependsOn: ["worker-crypto", "worker-sql"],
            tasksCount: 2,
            outputSnippet: "Validating HMAC finding and query sanitization",
          },
          {
            id: "confirmer",
            name: "confirmer-exploit",
            model: "claude-3-7-sonnet",
            status: "completed",
            duration: "0.9s",
            avatarColor: "#ec4899",
            dependsOn: ["worker-crypto", "worker-cors"],
            tasksCount: 1,
            outputSnippet: "Successfully reproduced exploit in sandbox",
          },
        ],
      },
      {
        title: "Deterministic Validation Gate",
        timestamp: Date.now() - 5000,
        status: "pending",
        workers: [
          {
            id: "gate-verifier",
            name: "gate-verifier",
            model: "world.run",
            status: "pending",
            duration: "pending",
            avatarColor: "#10b981",
            dependsOn: ["reviewer", "confirmer"],
            tasksCount: 1,
            outputSnippet: "Waiting for review consensus before executing gate test",
          },
        ],
        gate: {
          command: "pnpm test",
          exitCode: 0,
          status: "passed",
        },
      },
    ],
    reports: [
      { timestamp: Date.now() - 25000, payload: { worker: "auditor-crypto.ts", target: "src/jwt.ts", finding: "Weak secret entropy in HMAC key" } },
      { timestamp: Date.now() - 20000, payload: { worker: "auditor-sql.ts", target: "src/query.ts", finding: "Safe parameterized input" } },
      { timestamp: Date.now() - 15000, payload: { worker: "auditor-cors.ts", target: "src/server.ts", finding: "Wildcard origin warning on /api/*" } },
      { timestamp: Date.now() - 8000, payload: { cacheEngine: "sqlite", hitRatio: "75%", tokensSaved: 14200 } },
    ],
    cachedStepsCount: 8,
    liveStepsCount: 4,
    artifacts: [
      { id: "art-audit", title: "security-audit-report.md", kind: "markdown", size: "14.2 KB" },
      { id: "art-sarif", title: "vulnerabilities.sarif.json", kind: "json", size: "8.1 KB" },
    ],
  },
  {
    runId: "dwf-planner-reviewer-debate",
    status: "completed",
    startedAt: Date.now() - 210000,
    completedAt: Date.now() - 15000,
    currentPhase: "Gate Approval: Consensus Reached",
    phases: [
      {
        title: "Architecture Proposal by Planner",
        timestamp: Date.now() - 180000,
        status: "completed",
        workers: [
          {
            id: "architect-planner",
            name: "architect-planner",
            model: "claude-3-7-sonnet",
            status: "completed",
            duration: "3.2s",
            avatarColor: "#a855f7",
            tasksCount: 2,
            outputSnippet: "Drafted database rollback protocol",
          },
        ],
      },
      {
        title: "Critique & Edge Cases by Reviewer",
        timestamp: Date.now() - 120000,
        status: "completed",
        workers: [
          {
            id: "system-reviewer",
            name: "system-reviewer",
            model: "o3-mini",
            status: "completed",
            duration: "2.8s",
            avatarColor: "#10b981",
            dependsOn: ["architect-planner"],
            tasksCount: 3,
            outputSnippet: "Identified race condition on concurrent write",
          },
        ],
      },
      {
        title: "Consensus Convergence Loop",
        timestamp: Date.now() - 60000,
        status: "completed",
        rounds: 2,
        workers: [
          {
            id: "planner-amend",
            name: "planner-amend",
            model: "claude-3-7-sonnet",
            status: "cached",
            duration: "0t (cached)",
            avatarColor: "#a855f7",
            dependsOn: ["system-reviewer"],
            tasksCount: 1,
            outputSnippet: "Integrated retry mechanism with exponential backoff",
          },
          {
            id: "reviewer-approve",
            name: "reviewer-approve",
            model: "o3-mini",
            status: "completed",
            duration: "1.9s",
            avatarColor: "#10b981",
            dependsOn: ["planner-amend"],
            tasksCount: 1,
            outputSnippet: "Review score 9/10: Consensus reached",
          },
        ],
      },
      {
        title: "Gate Approval: Consensus Reached",
        timestamp: Date.now() - 15000,
        status: "completed",
        workers: [
          {
            id: "gate-eval",
            name: "gate-eval",
            model: "world.run",
            status: "completed",
            duration: "0.2s",
            avatarColor: "#10b981",
            dependsOn: ["reviewer-approve"],
            tasksCount: 1,
            outputSnippet: "node ./scripts/check-consensus.js passed",
          },
        ],
        gate: {
          command: "node ./scripts/check-consensus.js",
          exitCode: 0,
          status: "passed",
        },
      },
    ],
    reports: [
      { timestamp: Date.now() - 110000, payload: { round: 1, reviewerScore: 6, feedback: "Missing rollback handling in sqlite tx" } },
      { timestamp: Date.now() - 50000, payload: { round: 2, reviewerScore: 9, feedback: "Rollback transaction logic verified" } },
      { timestamp: Date.now() - 15000, payload: { gate: "consensus", approved: true } },
    ],
    cachedStepsCount: 16,
    liveStepsCount: 2,
    result: {
      status: "approved",
      rounds: 2,
    },
    artifacts: [
      { id: "art-spec", title: "system-architecture-spec.md", kind: "markdown", size: "22.6 KB" },
    ],
  },
  {
    runId: "dwf-cargo-test-verify",
    status: "failed",
    startedAt: Date.now() - 250000,
    completedAt: Date.now() - 100000,
    currentPhase: "Deterministic Gate Check",
    phases: [
      {
        title: "Generate Rust FFI Bindings",
        timestamp: Date.now() - 240000,
        status: "completed",
        workers: [
          {
            id: "bindgen-agent",
            name: "bindgen-agent",
            model: "codex/gpt-5.4",
            status: "completed",
            duration: "2.5s",
            avatarColor: "#3b82f6",
            tasksCount: 2,
            outputSnippet: "FFI bindings generated successfully",
          },
        ],
      },
      {
        title: "Apply Lifetime annotations",
        timestamp: Date.now() - 180000,
        status: "completed",
        workers: [
          {
            id: "rust-lifetime-coder",
            name: "rust-lifetime-coder",
            model: "codex/gpt-5.4",
            status: "completed",
            duration: "4.1s",
            avatarColor: "#3b82f6",
            dependsOn: ["bindgen-agent"],
            tasksCount: 4,
            outputSnippet: "Added 'a lifetime to borrow references",
          },
        ],
      },
      {
        title: "Deterministic Gate Check",
        timestamp: Date.now() - 120000,
        status: "failed",
        rounds: 3,
        workers: [
          {
            id: "cargo-gate",
            name: "cargo-gate",
            model: "world.run",
            status: "failed",
            duration: "1.2s",
            avatarColor: "#f43f5e",
            dependsOn: ["rust-lifetime-coder"],
            tasksCount: 1,
            outputSnippet: "cargo test --workspace exited with code 101",
          },
        ],
        gate: {
          command: "cargo test --workspace",
          exitCode: 101,
          status: "failed",
        },
      },
    ],
    reports: [
      { timestamp: Date.now() - 120000, payload: { attempt: 3, exitCode: 101, error: "E0502: cannot borrow *self as mutable" } },
    ],
    cachedStepsCount: 2,
    liveStepsCount: 3,
    error: "Deterministic gate rejected after 3 rounds: cargo test --workspace exited with code 101: borrow checker error E0502",
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

export const FailedGateCheck: Story = {
  args: {
    theme: mockPaseoTheme as any,
    runs: mockRuns,
    selectedRunId: "dwf-cargo-test-verify",
  },
};

export const EmptyState: Story = {
  args: {
    theme: mockPaseoTheme as any,
    runs: [],
    selectedRunId: null,
  },
};
