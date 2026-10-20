export interface AgentConfig {
  provider?: string;
  model?: string;
  system?: string;
  isolation?: "worktree" | "local";
}

export interface AskOptions {
  timeoutMs?: number;
}

export interface AgentInstance {
  readonly name: string;
  ask<T = string>(prompt: string, options?: AskOptions): Promise<T>;
}

export interface WorldRunOptions {
  cwd?: string;
  env?: Record<string, string>;
  timeoutMs?: number;
}

export interface WorldRunResult {
  exitCode: number;
  stdout: string;
  stderr: string;
}

export interface WorldContext {
  run(command: string, args?: string[], options?: WorldRunOptions): Promise<WorldRunResult>;
}

export interface FilesContext {
  glob(pattern: string, options?: { cwd?: string }): Promise<string[]>;
  grep(pattern: string, filePattern?: string, options?: { cwd?: string }): Promise<Array<{ path: string; line: number; match: string }>>;
}

export interface ArtifactOptions {
  title?: string;
}

export interface ArtifactContext {
  markdown(name: string, content: string, options?: ArtifactOptions): Promise<string>;
}
