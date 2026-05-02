import path from 'node:path';
import type { ProjectFileStat, ProjectFileSystem } from '../../src/application/project-ports.js';

type MemoryEntry =
  | { type: 'dir'; mtimeMs: number }
  | { type: 'file'; content: string; mtimeMs: number };

const normalize = (filePath: string) => path.resolve(filePath);

const createStat = (entry: MemoryEntry): ProjectFileStat => ({
  isDirectory: () => entry.type === 'dir',
  isFile: () => entry.type === 'file',
  mtimeMs: entry.mtimeMs
});

export class MemoryFileSystem implements ProjectFileSystem {
  private readonly entries = new Map<string, MemoryEntry>();
  private clock = 1;

  constructor(root = process.cwd()) {
    this.entries.set(normalize(root), { type: 'dir', mtimeMs: this.now() });
  }

  async pathExists(filePath: string): Promise<boolean> {
    return this.entries.has(normalize(filePath));
  }

  async ensureDir(dirPath: string): Promise<void> {
    const normalized = normalize(dirPath);
    const parent = path.dirname(normalized);
    if (parent !== normalized && !this.entries.has(parent)) {
      await this.ensureDir(parent);
    }
    this.entries.set(normalized, { type: 'dir', mtimeMs: this.now() });
  }

  async copy(sourcePath: string, targetPath: string, options?: { overwrite?: boolean }): Promise<void> {
    const source = normalize(sourcePath);
    const target = normalize(targetPath);
    const sourceEntry = this.getEntry(source);

    if (sourceEntry.type === 'file') {
      if (options?.overwrite === false && this.entries.has(target)) {
        return;
      }
      await this.ensureDir(path.dirname(target));
      this.entries.set(target, { ...sourceEntry, mtimeMs: this.now() });
      return;
    }

    await this.ensureDir(target);
    for (const [entryPath, entry] of [...this.entries]) {
      if (entryPath === source || !entryPath.startsWith(`${source}${path.sep}`)) {
        continue;
      }

      const relativePath = path.relative(source, entryPath);
      const nextTarget = path.join(target, relativePath);
      if (entry.type === 'dir') {
        await this.ensureDir(nextTarget);
      } else if (options?.overwrite !== false || !this.entries.has(nextTarget)) {
        await this.writeFile(nextTarget, entry.content);
      }
    }
  }

  async readDir(dirPath: string): Promise<string[]> {
    const dir = normalize(dirPath);
    const names = new Set<string>();
    for (const entryPath of this.entries.keys()) {
      if (entryPath !== dir && path.dirname(entryPath) === dir) {
        names.add(path.basename(entryPath));
      }
    }
    return [...names].sort();
  }

  async readFile(filePath: string): Promise<string> {
    const entry = this.getEntry(normalize(filePath));
    if (entry.type !== 'file') {
      throw new Error(`Not a file: ${filePath}`);
    }
    return entry.content;
  }

  async writeFile(filePath: string, content: string): Promise<void> {
    const normalized = normalize(filePath);
    await this.ensureDir(path.dirname(normalized));
    this.entries.set(normalized, { type: 'file', content, mtimeMs: this.now() });
  }

  async readJson<T = Record<string, unknown>>(filePath: string): Promise<T> {
    return JSON.parse(await this.readFile(filePath)) as T;
  }

  async writeJson(filePath: string, data: unknown, options?: { spaces?: number }): Promise<void> {
    await this.writeFile(filePath, JSON.stringify(data, null, options?.spaces));
  }

  async stat(filePath: string): Promise<ProjectFileStat> {
    return createStat(this.getEntry(normalize(filePath)));
  }

  async chmod(): Promise<void> {
    return;
  }

  private getEntry(filePath: string): MemoryEntry {
    const entry = this.entries.get(filePath);
    if (!entry) {
      throw new Error(`Path not found: ${filePath}`);
    }
    return entry;
  }

  private now(): number {
    this.clock += 1;
    return this.clock;
  }
}
