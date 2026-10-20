import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { readdirSync, statSync, readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import vm from "node:vm";
import type { PaseoApi, PaseoAgentHandle } from "@getpaseo/client";
import type { WorkflowRunInput, WorkflowRunStatus } from "../../shared/types";
import { WorkflowCache } from "./cache";
import { ConcurrencyLimiter } from "./limiter";
import type {
  AgentConfig,
  AgentInstance,
  AskOptions,
  WorldRunOptions,
  WorldRunResult,
  WorldContext,
  FilesContext,
  ArtifactContext,
} from "./types";

const execFileAsync = promisify(execFile);

export class WorkflowRunner {
  private cache: WorkflowCache;

  constructor(cache?: WorkflowCache) {
    this.cache = cache || new WorkflowCache();
  }

  public async run(
    input: WorkflowRunInput,
    paseo: PaseoApi
  ): Promise<WorkflowRunStatus> {
    const runId = `dwf-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const limiter = new ConcurrencyLimiter(input.maxConcurrency || 4);
    const agentHandles = new Map<string, PaseoAgentHandle>();

    const status: WorkflowRunStatus = {
      runId,
      status: "running",
      phases: [],
      reports: [],
      cachedStepsCount: 0,
      liveStepsCount: 0,
      startedAt: Date.now(),
    };

    const updateStatus = () => {
      this.cache.saveRun(status);
    };
    updateStatus();

    const phase = (title: string) => {
      status.currentPhase = title;
      status.phases.push({ title, timestamp: Date.now() });
      updateStatus();
    };

    const report = (payload: any) => {
      status.reports.push({ payload, timestamp: Date.now() });
      updateStatus();
    };

    const log = (msg: string) => {
      // Streamed or recorded to console / timeline
      console.log(`[workflow:${runId}] ${msg}`);
    };

    const parseResponse = <T>(text: string): T => {
      const trimmed = text.trim();
      const jsonMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      const jsonCandidate = jsonMatch ? jsonMatch[1].trim() : trimmed;

      try {
        return JSON.parse(jsonCandidate) as T;
      } catch {
        return trimmed as unknown as T;
      }
    };

    const agent = (
      name?: string,
      configOrSystem?: string | AgentConfig
    ): AgentInstance => {
      const agentName = name || `agent-${Math.random().toString(36).slice(2, 7)}`;
      const config: AgentConfig =
        typeof configOrSystem === "string"
          ? { system: configOrSystem }
          : configOrSystem || {};

      const provider =
        config.provider || input.subagentModel || "default";
      const workflowCache = this.cache;

      return {
        name: agentName,
        ask: async <T = string>(prompt: string, options?: AskOptions): Promise<T> => {
          const cached = workflowCache.getCachedStep(agentName, prompt);
          if (cached !== null) {
            status.cachedStepsCount++;
            updateStatus();
            return cached as T;
          }

          status.liveStepsCount++;
          updateStatus();

          return await limiter.run(async () => {
            let handle = agentHandles.get(agentName);

            if (!handle) {
              handle = await paseo.agents.create({
                config: {
                  provider: provider === "default" ? "codex/gpt-5.4" : provider,
                  systemPrompt: config.system,
                },
                cwd: input.cwd,
                parent: input.parentAgentId,
                title: `[WF] ${agentName}`,
                prompt,
                worktree:
                  config.isolation === "worktree"
                    ? { mode: "branch-off", newBranch: `wf-${runId}-${agentName}` }
                    : undefined,
              });
              agentHandles.set(agentName, handle);
            } else {
              await handle.send(prompt);
            }

            const timeoutMs = options?.timeoutMs || 600_000;
            const turnResult = await handle.waitForFinish(timeoutMs);

            if (turnResult.status === "error") {
              throw new Error(
                `Subagent '${agentName}' failed: ${turnResult.error || "Unknown error"}`
              );
            }

            const lastMessage = turnResult.lastMessage || "";
            const parsed = parseResponse<T>(lastMessage);

            workflowCache.saveStep(runId, agentName, prompt, parsed, provider);
            return parsed;
          });
        },
      };
    };

    const world: WorldContext = {
      async run(
        command: string,
        args: string[] = [],
        options: WorldRunOptions = {}
      ): Promise<WorldRunResult> {
        const cwd = options.cwd ? resolve(input.cwd, options.cwd) : input.cwd;
        try {
          const { stdout, stderr } = await execFileAsync(command, args, {
            cwd,
            env: { ...process.env, ...options.env },
            timeout: options.timeoutMs || 120_000,
            maxBuffer: 10 * 1024 * 1024,
          });
          return { exitCode: 0, stdout: stdout.toString(), stderr: stderr.toString() };
        } catch (err: any) {
          return {
            exitCode: err.code ?? (typeof err.status === "number" ? err.status : 1),
            stdout: err.stdout ? err.stdout.toString() : "",
            stderr: err.stderr ? err.stderr.toString() : err.message,
          };
        }
      },
    };

    const files: FilesContext = {
      async glob(pattern: string, options = {}): Promise<string[]> {
        const root = options.cwd ? resolve(input.cwd, options.cwd) : input.cwd;
        const results: string[] = [];

        function walk(dir: string) {
          const entries = readdirSync(dir, { withFileTypes: true });
          for (const entry of entries) {
            const fullPath = join(dir, entry.name);
            const relPath = fullPath.replace(`${root}/`, "");
            if (entry.name.startsWith(".") || entry.name === "node_modules") continue;

            if (entry.isDirectory()) {
              walk(fullPath);
            } else if (entry.isFile()) {
              if (matchesPattern(relPath, pattern)) {
                results.push(relPath);
              }
            }
          }
        }

        walk(root);
        return results;
      },

      async grep(pattern: string, filePattern?: string, options = {}) {
        const root = options.cwd ? resolve(input.cwd, options.cwd) : input.cwd;
        try {
          const grepArgs = ["-rnI", pattern];
          if (filePattern) {
            grepArgs.push("--include", filePattern);
          }
          grepArgs.push(".");
          const { stdout } = await execFileAsync("grep", grepArgs, {
            cwd: root,
            maxBuffer: 10 * 1024 * 1024,
          });

          const hits: Array<{ path: string; line: number; match: string }> = [];
          for (const line of stdout.toString().split("\n")) {
            if (!line) continue;
            const parts = line.split(":");
            if (parts.length >= 3) {
              const path = parts[0].replace(/^\.\//, "");
              const lineNum = parseInt(parts[1], 10);
              const match = parts.slice(2).join(":");
              hits.push({ path, line: lineNum, match });
            }
          }
          return hits;
        } catch {
          return [];
        }
      },
    };

    const artifact: ArtifactContext = {
      async markdown(name: string, content: string, options = {}) {
        const outDir = join(input.cwd, ".paseo", "artifacts");
        if (!existsSync(outDir)) {
          mkdirSync(outDir, { recursive: true });
        }
        const filePath = join(outDir, `${runId}-${name}.md`);
        const header = options.title ? `# ${options.title}\n\n` : "";
        writeFileSync(filePath, header + content, "utf-8");
        return filePath;
      },
    };

    let scriptSource = input.script || "";
    if (input.path) {
      const scriptFile = resolve(input.cwd, input.path);
      scriptSource = readFileSync(scriptFile, "utf-8");
    }

    if (!scriptSource.trim()) {
      status.status = "failed";
      status.error = "No workflow script or valid path provided.";
      status.completedAt = Date.now();
      updateStatus();
      return status;
    }

    try {
      const sandbox = {
        agent,
        world,
        files,
        artifact,
        phase,
        log,
        report,
        Promise,
        JSON,
        Math,
        console,
        Buffer,
        setTimeout,
        clearTimeout,
      };

      const context = vm.createContext(sandbox);
      const wrappedScript = `(async () => {\n${scriptSource}\n})()`;
      const result = await vm.runInContext(wrappedScript, context, {
        timeout: 3_600_000,
      });

      status.status = "completed";
      status.result = result;
      status.completedAt = Date.now();
      updateStatus();
      return status;
    } catch (err: any) {
      status.status = "failed";
      status.error = err.message || String(err);
      status.completedAt = Date.now();
      updateStatus();
      return status;
    }
  }
}

function matchesPattern(path: string, globPattern: string): boolean {
  if (globPattern === "*" || globPattern === "**/*") return true;
  const regexStr = globPattern
    .replace(/\./g, "\\.")
    .replace(/\*\*/g, ".*")
    .replace(/(?<!\.)\*/g, "[^/]*");
  return new RegExp(`^${regexStr}$`).test(path);
}
