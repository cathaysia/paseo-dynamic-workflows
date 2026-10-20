import { DatabaseSync } from "node:sqlite";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { homedir } from "node:os";
import type { WorkflowRunStatus } from "../../shared/types";

export class WorkflowCache {
  private db: DatabaseSync;

  constructor(dbPath?: string) {
    const finalPath =
      dbPath || join(homedir(), ".paseo", "workflows", "cache.sqlite");
    const dir = dirname(finalPath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    this.db = new DatabaseSync(finalPath);
    this.init();
  }

  private init() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS workflow_runs (
        id TEXT PRIMARY KEY,
        status TEXT NOT NULL,
        current_phase TEXT,
        phases_json TEXT NOT NULL,
        reports_json TEXT NOT NULL,
        result_json TEXT,
        error TEXT,
        cached_steps INTEGER NOT NULL DEFAULT 0,
        live_steps INTEGER NOT NULL DEFAULT 0,
        started_at INTEGER NOT NULL,
        completed_at INTEGER
      );

      CREATE TABLE IF NOT EXISTS workflow_steps (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        run_id TEXT NOT NULL,
        agent_name TEXT NOT NULL,
        prompt_hash TEXT NOT NULL,
        prompt_text TEXT NOT NULL,
        result_json TEXT NOT NULL,
        model TEXT,
        created_at INTEGER NOT NULL,
        UNIQUE(agent_name, prompt_hash)
      );

      CREATE INDEX IF NOT EXISTS idx_workflow_steps_lookup 
      ON workflow_steps(agent_name, prompt_hash);
    `);
  }

  public hash(agentName: string, prompt: string): string {
    return createHash("sha256")
      .update(`${agentName}::${prompt.trim()}`)
      .digest("hex");
  }

  public getCachedStep(agentName: string, prompt: string): any | null {
    const promptHash = this.hash(agentName, prompt);
    const stmt = this.db.prepare(
      "SELECT result_json FROM workflow_steps WHERE agent_name = ? AND prompt_hash = ?"
    );
    const row = stmt.get(agentName, promptHash) as
      | { result_json: string }
      | undefined;
    if (!row) return null;
    try {
      return JSON.parse(row.result_json);
    } catch {
      return row.result_json;
    }
  }

  public saveStep(
    runId: string,
    agentName: string,
    prompt: string,
    result: any,
    model?: string
  ) {
    const promptHash = this.hash(agentName, prompt);
    const resultJson =
      typeof result === "string" ? result : JSON.stringify(result);
    const stmt = this.db.prepare(`
      INSERT INTO workflow_steps (run_id, agent_name, prompt_hash, prompt_text, result_json, model, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(agent_name, prompt_hash) DO UPDATE SET
        run_id = excluded.run_id,
        result_json = excluded.result_json,
        created_at = excluded.created_at
    `);
    stmt.run(
      runId,
      agentName,
      promptHash,
      prompt,
      resultJson,
      model || "default",
      Date.now()
    );
  }

  public saveRun(status: WorkflowRunStatus) {
    const stmt = this.db.prepare(`
      INSERT INTO workflow_runs (
        id, status, current_phase, phases_json, reports_json,
        result_json, error, cached_steps, live_steps, started_at, completed_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        status = excluded.status,
        current_phase = excluded.current_phase,
        phases_json = excluded.phases_json,
        reports_json = excluded.reports_json,
        result_json = excluded.result_json,
        error = excluded.error,
        cached_steps = excluded.cached_steps,
        live_steps = excluded.live_steps,
        completed_at = excluded.completed_at
    `);

    stmt.run(
      status.runId,
      status.status,
      status.currentPhase || null,
      JSON.stringify(status.phases),
      JSON.stringify(status.reports),
      status.result ? JSON.stringify(status.result) : null,
      status.error || null,
      status.cachedStepsCount,
      status.liveStepsCount,
      status.startedAt,
      status.completedAt || null
    );
  }

  public getRun(runId: string): WorkflowRunStatus | null {
    const stmt = this.db.prepare("SELECT * FROM workflow_runs WHERE id = ?");
    const row = stmt.get(runId) as any;
    if (!row) return null;

    return {
      runId: row.id,
      status: row.status,
      currentPhase: row.current_phase || undefined,
      phases: JSON.parse(row.phases_json),
      reports: JSON.parse(row.reports_json),
      result: row.result_json ? JSON.parse(row.result_json) : undefined,
      error: row.error || undefined,
      cachedStepsCount: row.cached_steps,
      liveStepsCount: row.live_steps,
      startedAt: row.started_at,
      completedAt: row.completed_at || undefined,
    };
  }

  public listRuns(limit = 20): WorkflowRunStatus[] {
    const stmt = this.db.prepare(
      "SELECT * FROM workflow_runs ORDER BY started_at DESC LIMIT ?"
    );
    const rows = stmt.all(limit) as any[];
    return rows.map((row) => ({
      runId: row.id,
      status: row.status,
      currentPhase: row.current_phase || undefined,
      phases: JSON.parse(row.phases_json),
      reports: JSON.parse(row.reports_json),
      result: row.result_json ? JSON.parse(row.result_json) : undefined,
      error: row.error || undefined,
      cachedStepsCount: row.cached_steps,
      liveStepsCount: row.live_steps,
      startedAt: row.started_at,
      completedAt: row.completed_at || undefined,
    }));
  }
}
