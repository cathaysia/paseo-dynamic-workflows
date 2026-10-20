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
        runId: "dwf-fanout-security-scan",
        status: "running",
        currentPhase: "Parallel Implementation & Audit",
        cachedStepsCount: 8,
        liveStepsCount: 4,
        reports: [],
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
                dependsOn: ["worker-crypto", "worker-cors"],
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
                dependsOn: ["worker-sql", "worker-auth"],
                tasksCount: 1,
                outputSnippet: "Successfully reproduced exploit in sandbox",
              },
            ],
          },
          {
            title: "Deterministic Gate Verification",
            timestamp: Date.now() - 5000,
            status: "pending",
            gate: {
              command: "pnpm audit --prod && pnpm test",
              exitCode: 0,
              status: "passed",
            },
            workers: [
              {
                id: "gate-tester",
                name: "gate-verifier",
                model: "world.run",
                status: "pending",
                duration: "pending",
                avatarColor: "#64748b",
                dependsOn: ["reviewer", "confirmer"],
                tasksCount: 1,
                outputSnippet: "Waiting on reviewer consensus before running pnpm test",
              },
            ],
          },
        ],
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
        cachedStepsCount: 14,
        liveStepsCount: 2,
        reports: [],
        phases: [
          {
            title: "AST Call-Graph Mapping",
            timestamp: Date.now() - 60000,
            status: "completed",
            workers: [
              {
                id: "mapper",
                name: "ast-mapper",
                model: "codex/gpt-5.4",
                status: "cached",
                duration: "0t (cached)",
                avatarColor: "#3b82f6",
                outputSnippet: "Parsed 48 modules in 12ms from SQLite AST cache",
              },
            ],
          },
          {
            title: "Static Taint Analysis",
            timestamp: Date.now() - 40000,
            status: "completed",
            workers: [
              {
                id: "taint-auth",
                name: "taint-auth.ts",
                model: "claude-3-7-sonnet",
                status: "completed",
                duration: "1.1s",
                avatarColor: "#8b5cf6",
                dependsOn: ["mapper"],
                outputSnippet: "No unescaped query interpolations",
              },
              {
                id: "taint-api",
                name: "taint-api.ts",
                model: "o3-mini",
                status: "cached",
                duration: "0t (cached)",
                avatarColor: "#10b981",
                dependsOn: ["mapper"],
                outputSnippet: "Input validation schemas strictly typed",
              },
            ],
          },
          {
            title: "Deterministic Verification",
            timestamp: Date.now() - 10000,
            status: "completed",
            gate: {
              command: "pnpm test",
              exitCode: 0,
              status: "passed",
            },
            workers: [
              {
                id: "tester",
                name: "test-suite",
                model: "world.run",
                status: "completed",
                duration: "0.8s",
                avatarColor: "#10b981",
                dependsOn: ["taint-auth", "taint-api"],
                outputSnippet: "All 32 test suites passed with 100% assertions green",
              },
            ],
          },
        ],
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
        cachedStepsCount: 1,
        liveStepsCount: 3,
        error: "Deterministic gate rejected after 3 rounds: cargo test exited with code 101: borrow checker error E0502",
        reports: [],
        phases: [
          {
            title: "Inspect build errors",
            timestamp: Date.now() - 50000,
            status: "completed",
            workers: [
              {
                id: "rust-analyzer",
                name: "analyzer-rust",
                model: "claude-3-7-sonnet",
                status: "completed",
                duration: "1.0s",
                avatarColor: "#f59e0b",
                outputSnippet: "Captured 3 borrow checker errors in packet_forwarder.rs",
              },
            ],
          },
          {
            title: "Lifetime Fix Coder",
            timestamp: Date.now() - 30000,
            status: "completed",
            workers: [
              {
                id: "coder",
                name: "coder-lifetime-patch",
                model: "codex/gpt-5.4",
                status: "completed",
                duration: "2.4s",
                avatarColor: "#06b6d4",
                dependsOn: ["rust-analyzer"],
                outputSnippet: "Replaced mutable borrow with Arc<RwLock<T>>",
              },
            ],
          },
          {
            title: "Verify with cargo test",
            timestamp: Date.now() - 10000,
            status: "failed",
            rounds: 3,
            gate: {
              command: "cargo test",
              exitCode: 101,
              status: "failed",
            },
            workers: [
              {
                id: "verifier",
                name: "cargo-test-gate",
                model: "world.run",
                status: "failed",
                duration: "0.5s",
                avatarColor: "#f43f5e",
                dependsOn: ["coder"],
                outputSnippet: "error[E0502]: cannot borrow `conn` as mutable because it is also borrowed as immutable",
              },
            ],
          },
        ],
      },
    },
  },
};
