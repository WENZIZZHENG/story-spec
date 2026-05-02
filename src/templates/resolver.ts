import path from 'node:path';
import fs from 'fs-extra';

export type TemplateSourceKind = 'core' | 'extension' | 'preset' | 'project';

export interface TemplateSource {
  kind: TemplateSourceKind;
  name: string;
  rootDir: string;
  priority: number;
}

export interface TemplateStackLayer {
  name?: string;
  rootDir: string;
}

export interface ResolveTemplateStackInput {
  coreRoot: string;
  extensions?: readonly TemplateStackLayer[];
  presets?: readonly TemplateStackLayer[];
  projectRoot?: string;
}

export interface ResolvedTemplate {
  relativePath: string;
  absolutePath: string;
  content: string;
  source: TemplateSource;
}

export interface TemplateOverride {
  relativePath: string;
  winner: ResolvedTemplate;
  shadowed: ResolvedTemplate[];
}

export interface ResolveTemplateStackResult {
  templates: ResolvedTemplate[];
  overrides: TemplateOverride[];
  sources: TemplateSource[];
}

const toPosixPath = (value: string): string => value.split(path.sep).join('/');

const collectTemplateFiles = async (
  rootDir: string,
  currentDir = rootDir
): Promise<string[]> => {
  if (!await fs.pathExists(rootDir)) {
    return [];
  }

  const entries = await fs.readdir(currentDir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const entryPath = path.join(currentDir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await collectTemplateFiles(rootDir, entryPath));
    } else if (entry.isFile()) {
      files.push(toPosixPath(path.relative(rootDir, entryPath)));
    }
  }

  return files.sort();
};

const createSources = (input: ResolveTemplateStackInput): TemplateSource[] => {
  const sources: TemplateSource[] = [{
    kind: 'core',
    name: 'core',
    rootDir: input.coreRoot,
    priority: 0
  }];

  input.extensions?.forEach((extension, index) => {
    sources.push({
      kind: 'extension',
      name: extension.name ?? `extension-${index + 1}`,
      rootDir: extension.rootDir,
      priority: 100 + index
    });
  });

  input.presets?.forEach((preset, index) => {
    sources.push({
      kind: 'preset',
      name: preset.name ?? `preset-${index + 1}`,
      rootDir: preset.rootDir,
      priority: 200 + index
    });
  });

  if (input.projectRoot) {
    sources.push({
      kind: 'project',
      name: 'project',
      rootDir: input.projectRoot,
      priority: 300
    });
  }

  return sources;
};

export const resolveTemplateStack = async (
  input: ResolveTemplateStackInput
): Promise<ResolveTemplateStackResult> => {
  const sources = createSources(input);
  const candidates = new Map<string, ResolvedTemplate[]>();

  for (const source of sources) {
    const files = await collectTemplateFiles(source.rootDir);
    for (const relativePath of files) {
      const absolutePath = path.join(source.rootDir, ...relativePath.split('/'));
      const template: ResolvedTemplate = {
        relativePath,
        absolutePath,
        content: await fs.readFile(absolutePath, 'utf-8'),
        source
      };

      candidates.set(relativePath, [...candidates.get(relativePath) ?? [], template]);
    }
  }

  const templates: ResolvedTemplate[] = [];
  const overrides: TemplateOverride[] = [];

  for (const [relativePath, candidatesForPath] of [...candidates.entries()].sort(([left], [right]) => left.localeCompare(right))) {
    const sorted = [...candidatesForPath].sort((left, right) => right.source.priority - left.source.priority);
    const [winner, ...shadowed] = sorted;
    templates.push(winner);

    if (shadowed.length > 0) {
      overrides.push({
        relativePath,
        winner,
        shadowed
      });
    }
  }

  return {
    templates,
    overrides,
    sources
  };
};

export const writeResolvedTemplates = async (
  templates: readonly ResolvedTemplate[],
  targetRoot: string
): Promise<void> => {
  for (const template of templates) {
    const targetPath = path.join(targetRoot, ...template.relativePath.split('/'));
    await fs.ensureDir(path.dirname(targetPath));
    await fs.writeFile(targetPath, template.content);
  }
};
