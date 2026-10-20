# Dynamic Workflow Patterns

Catalogue of common multi-agent orchestration shapes in Paseo.

---

## 1. Fan-out / Fan-in over Files

Audit or analyze many files in parallel using concurrency limits and independent subagents:

```ts
phase("Find relevant source files");
const paths = await files.glob("src/**/*.ts");
log(`Found ${paths.length} files to audit`);

phase("Run parallel security audits");
const audits = await Promise.all(
  paths.map((p) =>
    agent(`auditor-${p}`).ask<AuditResult>(`Review ${p} for security vulnerabilities.`)
  )
);

const failed = audits.filter((a) => !a.passed);
report({ total: paths.length, failedCount: failed.length, failures: failed });

return failed;
```

---

## 2. Review & Confirmation Pipeline (Fresh Eyes)

A reviewer finds potential issues; an independent confirmer validates each finding from the evidence alone:

```ts
phase("Review changed files");
const changedFiles = await files.glob("src/**/*.rs");

const confirmedFindings = (
  await Promise.all(
    changedFiles.map(async (file) => {
      const review = await agent(`reviewer-${file}`).ask<CodeReview>(
        `Review ${file} for logic bugs. Return structured findings.`
      );

      return Promise.all(
        review.findings.map(async (finding, idx) => {
          const check = await agent(`confirmer-${file}-${idx}`).ask<Confirmation>(
            `Reproduce this finding from code evidence alone. Do not modify files:\n${JSON.stringify(finding)}`
          );

          const item = { ...finding, verified: check.reproduced };
          report(item);
          return item;
        })
      );
    })
  )
).flat();

await artifact.markdown(
  "findings-summary",
  `# Findings\n\n${JSON.stringify(confirmedFindings, null, 2)}`
);

return confirmedFindings;
```

---

## 3. Worktree-Isolated Parallel Feature Implementation

Parallel workers implementing different modules simultaneously in isolated Git worktrees without collision:

```ts
const modules = ["auth", "billing", "notifications"];

phase("Implement modules concurrently in worktrees");
const branches = await Promise.all(
  modules.map(async (mod) => {
    const worker = agent(`worker-${mod}`, {
      provider: "codex/gpt-5.4",
      isolation: "worktree", // Clean git worktree per agent
    });

    const result = await worker.ask<BuildResult>(`Implement ${mod} module based on specifications.`);
    return { module: mod, status: result.status };
  })
);

phase("Run project integration test suite");
const suite = await world.run("pnpm", ["test"]);
return { modules: branches, integrationPassed: suite.exitCode === 0 };
```
