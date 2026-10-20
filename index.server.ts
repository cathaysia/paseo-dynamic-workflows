import type { PluginServerContext } from "@getpaseo/plugin/server";
import { readFileSync, existsSync, mkdirSync, symlinkSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import {
  runWorkflowRpc,
  getWorkflowStatusRpc,
  listWorkflowsRpc,
} from "./shared/contracts";
import { WorkflowCache } from "./server/engine/cache";
import { WorkflowRunner } from "./server/engine/runner";

const cache = new WorkflowCache();
const runner = new WorkflowRunner(cache);

export default function contribute(server: PluginServerContext) {
  // 1. 注册核心 Workflow 执行 RPC
  server.handle(runWorkflowRpc, async (input, { paseo }) => {
    return await runner.run(input, paseo);
  });

  // 2. 注册状态查询 RPC
  server.handle(getWorkflowStatusRpc, async (input) => {
    return cache.getRun(input.runId);
  });

  // 3. 注册历史列表 RPC
  server.handle(listWorkflowsRpc, async (input) => {
    return cache.listRuns(input.limit);
  });

  // 4. 自动注入 Skill 到系统 Prompt：每当 Paseo 创建 Agent 时，注入 Dynamic Workflow 技能指南
  const baseDir = typeof import.meta !== "undefined" && import.meta.dirname ? import.meta.dirname : process.cwd();
  const skillPath = join(baseDir, "skills", "dynamic-workflows", "SKILL.md");
  let skillContent = "";
  if (existsSync(skillPath)) {
    try {
      skillContent = readFileSync(skillPath, "utf-8");
    } catch {
      // ignore
    }
  }

  server.before("agent.create", async ({ request }) => {
    if (skillContent) {
      const injection = `\n\n[SYSTEM INJECTION: DYNAMIC WORKFLOW CAPABILITY]\n${skillContent}`;
      request.config.systemPrompt = (request.config.systemPrompt || "") + injection;
    }
    return request;
  });

  // 5. 自动分发到公共标准技能目录 (~/.agents/skills/dynamic-workflows)
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
  } catch {
    // ignore filesystem permission errors
  }

  return () => {};
}
