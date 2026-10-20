---
name: dynamic-workflows
description: "Design and launch dynamic workflow scripts in Paseo: choosing subagent topology, typing subagent results, fanning out over files, gating loops on deterministic world.run commands, planner-reviewer loops, confirming findings before reporting them, cache-backed incremental repair, and worktree isolation."
when_to_use: "Use when an orchestration workflow requires multiple subagents, fan-out parallel checks, iterative gated loops, or structured multi-stage pipelines."
---

# Dynamic Workflows in Paseo

Dynamic Workflows allow you to orchestrate multiple Paseo coding agents using pure TypeScript scripts.

Instead of writing static or verbose configuration files, a workflow is written as an executable script utilizing clean primitives:
- `agent(name?, options?)`: Spawns or references an agent with optional worktree isolation and custom provider/model.
- `agent.ask<T>(prompt)`: Queries a subagent, returning typed, structured data with automatic hash caching.
- `world.run(command, args)`: Executes real shell commands, gating loops and decisions on actual exit codes.
- `files.glob()` / `files.grep()`: Discovers files and code references.
- `phase(title)` / `report(data)`: Emits live progress and intermediate telemetry.
- `artifact.markdown(name, content)`: Publishes reports and deliverables.

---

## 1. Subagent Topology

Deciding how agents are distributed separates a performant, reliable workflow from a slow, brittle one:

### Fresh Subagent per item vs. One Shared Subagent

- **Independent contexts (`agent('item-id')`)**: Runs in parallel. Each agent sees only its own scope. Best for fan-out audits, reviews, and per-file migrations.
- **Shared context (`agent('judge')`)**: Consecutive calls share context history. Asks are executed in series, keeping judgment calibrated across items.

```ts
// Parallel independent reviewers:
await Promise.all(
  files.map((file) => agent(`reviewer-${file}`).ask<Review>(`Review ${file}`))
);

// Calibrated sequential reviewer:
const judge = agent("judge", { system: "You evaluate code quality consistently." });
for (const file of files) {
  const result = await judge.ask<Verdict>(`Evaluate ${file}`);
}
```

### Git Worktree Isolation

When subagents perform write operations or edits in parallel, enable worktree isolation so their git trees do not conflict:

```ts
const worker = agent(`worker-${item.id}`, {
  provider: "codex/gpt-5.4",
  isolation: "worktree", // Automatically branches off in a clean, isolated worktree!
});
```

---

## 2. Typed Results & JSDoc Guidance

Always pass a TypeScript interface to `ask<T>()` when branching on results. The JSDoc comments guide the subagent's structured output format:

```ts
interface Finding {
  /** Repository-relative path where the issue occurs */
  path: string;
  /** One-line explanation of the defect */
  issue: string;
  /** Impact severity level */
  severity: "low" | "medium" | "high";
}

const finding = await reviewer.ask<Finding>(`Audit ${path} for security flaws.`);
```

---

## 3. Fresh Eyes & Confirmer Review

A writer cannot see their own blind spots. Always separate the creation context from the review context:
- Keep the planner and reviewer in distinct subagents.
- Have a fresh confirmer agent reproduce findings before presenting them as truth.

```ts
const planner = agent("planner", "You draft concrete, minimal implementation plans.");
const reviewer = agent("reviewer", "You critique plans for edge cases. Never edit code.");

let feedback = "none";
for (let round = 0; round < 5; round++) {
  phase(`Plan refinement round ${round + 1}`);
  const plan = await planner.ask<Plan>(`Draft plan. Prior critique: ${feedback}`);
  const review = await reviewer.ask<Review>(`Critique this plan:\n${JSON.stringify(plan)}`);
  if (review.approved) return plan;
  feedback = review.feedback;
}
```

---

## 4. Deterministic Gates with `world.run`

Never let an LLM "claim" tests or builds pass. Drive your loops using actual command exit codes:

```ts
const coder = agent("coder", "Implement the fix for the reported test failure.");
await coder.ask(`Fix the bug in src/core.ts`);

for (let attempt = 1; attempt <= 5; attempt++) {
  phase(`Verification attempt ${attempt}`);
  const check = await world.run("cargo", ["test"]);
  
  if (check.exitCode === 0) {
    report({ status: "success", attempt });
    break;
  }

  // Supply actual stderr to the next round:
  await coder.ask(`Tests failed with exit code ${check.exitCode}:\n${check.stderr}\nFix it.`);
}
```

---

## 5. Incremental Caching & Resumption

Every `ask()` call is indexed in SQLite by `(agentName, promptHash)`:
- If a workflow errors or is modified, re-running it automatically replays previously completed asks at **zero token cost**.
- Keep prompts free of volatile constants (like loop round counters or thresholds) so cache hits are maximized.
