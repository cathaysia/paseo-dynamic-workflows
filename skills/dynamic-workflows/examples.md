# Complete Workflow Examples

Worked examples of runnable Paseo Dynamic Workflow scripts.

---

## Example: Codebase Modernization & Sanity Gated Loop

```ts
interface Analysis {
  deprecatedCalls: string[];
  recommendedFix: string;
}

interface FixResult {
  filesModified: string[];
  summary: string;
}

phase("Discover files needing modernization");
const targetFiles = await files.glob("src/**/*.ts");

phase("Analyze deprecations");
const analyses = await Promise.all(
  targetFiles.map(async (file) => {
    const res = await agent(`analyst-${file}`).ask<Analysis>(
      `Analyze ${file} for deprecated API usages. Return findings.`
    );
    return { file, ...res };
  })
);

const filesToFix = analyses.filter((a) => a.deprecatedCalls.length > 0);
log(`Identified ${filesToFix.length} files requiring updates.`);

phase("Apply modernization in isolated worktrees");
const migrator = agent("migrator", {
  provider: "codex/gpt-5.4",
  isolation: "worktree",
  system: "You apply code modernizations accurately while maintaining backwards compatibility."
});

let testPassed = false;
let round = 1;

while (round <= 5 && !testPassed) {
  phase(`Modernization attempt round ${round}`);
  
  await migrator.ask<FixResult>(
    `Apply modernizations to:\n${JSON.stringify(filesToFix)}`
  );

  phase("Verify with project test suite");
  const check = await world.run("pnpm", ["test"], { timeoutMs: 180_000 });

  if (check.exitCode === 0) {
    testPassed = true;
    report({ round, status: "passed", stdout: check.stdout });
    break;
  }

  log(`Round ${round} failed tests. Feeding stderr back to migrator.`);
  report({ round, status: "failed", stderr: check.stderr });

  await migrator.ask(
    `The tests failed with output:\n${check.stderr}\nFix the failing test cases.`
  );
  round++;
}

await artifact.markdown(
  "modernization-report",
  `# Modernization Report\n\n- Completed in ${round} rounds\n- Test Suite Passed: ${testPassed}`
);

return { success: testPassed, rounds: round };
```
