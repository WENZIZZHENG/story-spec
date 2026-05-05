export interface ProjectFileStat {
  isDirectory(): boolean;
  isFile(): boolean;
  mtimeMs: number;
}

export interface ProjectFileSystem {
  pathExists(filePath: string): Promise<boolean>;
  ensureDir(dirPath: string): Promise<void>;
  copy(sourcePath: string, targetPath: string, options?: { overwrite?: boolean }): Promise<void>;
  readDir(dirPath: string): Promise<string[]>;
  readFile(filePath: string): Promise<string>;
  writeFile(filePath: string, content: string): Promise<void>;
  readJson<T = Record<string, unknown>>(filePath: string): Promise<T>;
  writeJson(filePath: string, data: unknown, options?: { spaces?: number }): Promise<void>;
  stat(filePath: string): Promise<ProjectFileStat>;
  chmod(filePath: string, mode: number): Promise<void>;
}

export interface GitAdapter {
  init(projectPath: string): Promise<void>;
  addAll(projectPath: string): Promise<void>;
  commit(projectPath: string, message: string): Promise<void>;
  statusShort(projectPath: string): Promise<string[]>;
}

export interface VerificationCommandResult {
  exitCode: number;
  stdout?: string;
  stderr?: string;
}

export interface VerificationRunner {
  run(projectPath: string, command: string): Promise<VerificationCommandResult>;
}

export interface PluginInstaller {
  install(projectPath: string, pluginName: string, sourcePath: string): Promise<void>;
}
