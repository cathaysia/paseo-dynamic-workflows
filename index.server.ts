import type { PluginServerContext } from "@getpaseo/plugin/server";
import { readFileSync, existsSync, mkdirSync, symlinkSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import {
  runWorkflowRpc,
  getWorkflowStatusRpc,
  listWorkflowsRpc,
  cancelWorkflowRpc,
  retryAgentRpc,
  deleteWorkflowRpc,
} from "./shared/contracts";
import { WorkflowCache } from "./server/engine/cache";
import { WorkflowRunner } from "./server/engine/runner";

const cache = new WorkflowCache();
const runner = new WorkflowRunner(cache);

export default function contribute(server: PluginServerContext) {
  server.handle(runWorkflowRpc, async (input, { paseo }) => {
    return await runner.run(input, paseo);
  });

  server.handle(getWorkflowStatusRpc, async (input) => {
    return cache.getRun(input.runId);
  });

  server.handle(listWorkflowsRpc, async (input) => {
    return cache.listRuns(input.limit);
  });

  server.handle(cancelWorkflowRpc, async (input) => {
    return await runner.cancel(input.runId);
  });

  server.handle(retryAgentRpc, async (input, { paseo }) => {
    return await runner.retryAgent(input.runId, input.agentName, paseo);
  });

  server.handle(deleteWorkflowRpc, async (input) => {
    await runner.cancel(input.runId);
    cache.deleteRun(input.runId);
    return { success: true };
  });

  const baseDir = typeof import.meta !== "undefined" && import.meta.dirname ? import.meta.dirname : process.cwd();
  const skillPath = join(baseDir, "skills", "dynamic-workflows", "SKILL.md");
  let skillContent = "";
  if (existsSync(skillPath)) {
    try {
      skillContent = readFileSync(skillPath, "utf-8");
    } catch {}
  }

  server.before("agent.create", async ({ request }) => {
    if (skillContent) {
      const injection = `\n\n[SYSTEM INJECTION: DYNAMIC WORKFLOW CAPABILITY]\n${skillContent}`;
      request.config.systemPrompt = (request.config.systemPrompt || "") + injection;
    }
    return request;
  });

  try {
    const globalSkillsDir = join(homedir(), ".agents", "skills");
    const targetLink = join(globalSkillsDir, "dynamic-workflows");
    const sourceSkillDir = join(baseDir, "skills", "dynamic-workflows");

    if (!existsSync(globalSkillsDir)) {
      mkdirSync(globalSkillsDir, { recursive: true });
    }
    if (!existsSync(targetLink) && existsSync(sourceSkillDir)) {
      symlinkSync(sourceSkillDir, targetLink, "dir");
    }
  } catch {}

  return () => {};
}
