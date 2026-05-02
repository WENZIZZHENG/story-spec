import path from 'node:path';
import fsExtra from 'fs-extra';

export type TemplateSourceKind = 'core' | 'extension' | 'preset' | 'project';

export interface TemplateSource {
  kind: TemplateSourceKind;
  name: string;
  rootDir: string;
  priority: number;
  ignore?: readonly string[];
}

export interface TemplateStackLayer {
  name?: string;
  rootDir: string;
  priority?: number;
  ignore?: readonly string[];
}

export interface ResolveTemplateStackInput {
  coreRoot: string;
  coreIgnore?: readonly string[];
  extensions?: readonly TemplateStackLayer[];
  presets?: readonly TemplateStackLayer[];
  projectRoot?: string;
  projectIgnore?: readonly string[];
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

export interface TemplateSourceDiagnosticCandidate {
  kind: TemplateSourceKind;
  name: string;
  rootDir: string;
  absolutePath: string;
  priority: number;
  selected: boolean;
}

export interface TemplateSourceDiagnostic {
  relativePath: string;
  finalSource: TemplateSourceDiagnosticCandidate;
  shadowedSources: TemplateSourceDiagnosticCandidate[];
  candidates: TemplateSourceDiagnosticCandidate[];
  reason: string;
}

export interface ResolveTemplateStackResult {
  templates: ResolvedTemplate[];
  overrides: TemplateOverride[];
  sources: TemplateSource[];
  diagnostics: TemplateSourceDiagnostic[];
}

export interface TemplateFileStat {
  isDirectory(): boolean;
  isFile(): boolean;
}

export interface TemplateFileSystem {
  pathExists(filePath: string): Promise<boolean>;
  ensureDir(dirPath: string): Promise<void>;
  readDir(dirPath: string): Promise<string[]>;
  readFile(filePath: string): Promise<string>;
  writeFile(filePath: string, content: string): Promise<void>;
  stat(filePath: string): Promise<TemplateFileStat>;
}

export interface ResolveProjectTemplateStackInput {
  projectRoot: string;
  coreRoot?: string;
  projectOverrideRoot?: string;
  extensionsRoot?: string;
  presetsRoot?: string;
  fileSystem?: TemplateFileSystem;
}

export interface RenderTemplateSourceDiagnosticsOptions {
  heading?: string;
  includeUnshadowed?: boolean;
}

const nodeTemplateFileSystem: TemplateFileSystem = {
  pathExists: filePath => fsExtra.pathExists(filePath),
  ensureDir: dirPath => fsExtra.ensureDir(dirPath),
  readDir: dirPath => fsExtra.readdir(dirPath),
  readFile: filePath => fsExtra.readFile(filePath, 'utf-8'),
  writeFile: (filePath, content) => fsExtra.writeFile(filePath, content),
  stat: filePath => fsExtra.stat(filePath)
};

const toPosixPath = (value: string): string => value.split(path.sep).join('/');

const normalizeIgnorePattern = (value: string): string => value.replace(/\\/g, '/');

const isIgnoredPath = (relativePath: string, ignore: readonly string[] = []): boolean => {
  const normalizedPath = normalizeIgnorePattern(relativePath);

  return ignore.some(pattern => {
    const normalizedPattern = normalizeIgnorePattern(pattern);
    if (normalizedPattern.endsWith('/')) {
      return normalizedPath.startsWith(normalizedPattern);
    }

    return normalizedPath === normalizedPattern || normalizedPath.startsWith(`${normalizedPattern}/`);
  });
};

const collectTemplateFiles = async (
  rootDir: string,
  currentDir = rootDir,
  fileSystem: TemplateFileSystem = nodeTemplateFileSystem,
  ignore: readonly string[] = []
): Promise<string[]> => {
  if (!await fileSystem.pathExists(rootDir)) {
    return [];
  }

  const entries = await fileSystem.readDir(currentDir);
  const files: string[] = [];

  for (const entry of entries) {
    const entryPath = path.join(currentDir, entry);
    const relativePath = toPosixPath(path.relative(rootDir, entryPath));
    if (isIgnoredPath(relativePath, ignore)) {
      continue;
    }

    const stat = await fileSystem.stat(entryPath);
    if (stat.isDirectory()) {
      files.push(...await collectTemplateFiles(rootDir, entryPath, fileSystem, ignore));
    } else if (stat.isFile()) {
      files.push(relativePath);
    }
  }

  return files.sort();
};

const createSources = (input: ResolveTemplateStackInput): TemplateSource[] => {
  const sources: TemplateSource[] = [{
    kind: 'core',
    name: 'core',
    rootDir: input.coreRoot,
    priority: 0,
    ignore: input.coreIgnore
  }];

  input.extensions?.forEach((extension, index) => {
    sources.push({
      kind: 'extension',
      name: extension.name ?? `extension-${index + 1}`,
      rootDir: extension.rootDir,
      priority: extension.priority ?? 100 + index,
      ignore: extension.ignore
    });
  });

  input.presets?.forEach((preset, index) => {
    sources.push({
      kind: 'preset',
      name: preset.name ?? `preset-${index + 1}`,
      rootDir: preset.rootDir,
      priority: preset.priority ?? 200 + index,
      ignore: preset.ignore
    });
  });

  if (input.projectRoot) {
    sources.push({
      kind: 'project',
      name: 'project',
      rootDir: input.projectRoot,
      priority: 300,
      ignore: input.projectIgnore
    });
  }

  return sources;
};

const toDiagnosticCandidate = (
  template: ResolvedTemplate,
  selected: boolean
): TemplateSourceDiagnosticCandidate => ({
  kind: template.source.kind,
  name: template.source.name,
  rootDir: template.source.rootDir,
  absolutePath: template.absolutePath,
  priority: template.source.priority,
  selected
});

const formatSourceLabel = (
  source: Pick<TemplateSourceDiagnosticCandidate, 'kind' | 'name'>
): string => source.kind === source.name ? source.kind : `${source.kind}/${source.name}`;

const createSourceDiagnostic = (
  relativePath: string,
  sortedCandidates: readonly ResolvedTemplate[]
): TemplateSourceDiagnostic => {
  const [winner, ...shadowed] = sortedCandidates;
  const finalSource = toDiagnosticCandidate(winner, true);
  const shadowedSources = shadowed.map(template => toDiagnosticCandidate(template, false));
  const shadowedLabels = shadowedSources.map(formatSourceLabel);
  const reason = shadowedLabels.length > 0
    ? `${formatSourceLabel(finalSource)} overrides ${shadowedLabels.join(', ')}`
    : `${formatSourceLabel(finalSource)} provides the only source`;

  return {
    relativePath,
    finalSource,
    shadowedSources,
    candidates: [finalSource, ...shadowedSources],
    reason
  };
};

export const resolveTemplateStack = async (
  input: ResolveTemplateStackInput,
  fileSystem: TemplateFileSystem = nodeTemplateFileSystem
): Promise<ResolveTemplateStackResult> => {
  const sources = createSources(input);
  const candidates = new Map<string, ResolvedTemplate[]>();

  for (const source of sources) {
    const files = await collectTemplateFiles(source.rootDir, source.rootDir, fileSystem, source.ignore);
    for (const relativePath of files) {
      const absolutePath = path.join(source.rootDir, ...relativePath.split('/'));
      const template: ResolvedTemplate = {
        relativePath,
        absolutePath,
        content: await fileSystem.readFile(absolutePath),
        source
      };

      candidates.set(relativePath, [...candidates.get(relativePath) ?? [], template]);
    }
  }

  const templates: ResolvedTemplate[] = [];
  const overrides: TemplateOverride[] = [];
  const diagnostics: TemplateSourceDiagnostic[] = [];

  for (const [relativePath, candidatesForPath] of [...candidates.entries()].sort(([left], [right]) => left.localeCompare(right))) {
    const sorted = [...candidatesForPath].sort((left, right) => right.source.priority - left.source.priority);
    const [winner, ...shadowed] = sorted;
    templates.push(winner);
    diagnostics.push(createSourceDiagnostic(relativePath, sorted));

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
    sources,
    diagnostics
  };
};

const listTemplateLayerDirs = async (
  rootDir: string,
  fileSystem: TemplateFileSystem
): Promise<TemplateStackLayer[]> => {
  if (!await fileSystem.pathExists(rootDir)) {
    return [];
  }

  const layers: TemplateStackLayer[] = [];
  for (const entry of await fileSystem.readDir(rootDir)) {
    const entryPath = path.join(rootDir, entry);
    const stat = await fileSystem.stat(entryPath);
    if (stat.isDirectory()) {
      layers.push({
        name: entry,
        rootDir: entryPath
      });
    }
  }

  return layers.sort((left, right) => (left.name ?? '').localeCompare(right.name ?? ''));
};

export const resolveProjectTemplateStack = async (
  input: ResolveProjectTemplateStackInput
): Promise<ResolveTemplateStackResult> => {
  const fileSystem = input.fileSystem ?? nodeTemplateFileSystem;
  const specifyRoot = path.join(input.projectRoot, '.specify');

  return resolveTemplateStack({
    coreRoot: input.coreRoot ?? path.join(specifyRoot, 'templates'),
    coreIgnore: ['overrides/'],
    extensions: await listTemplateLayerDirs(
      input.extensionsRoot ?? path.join(specifyRoot, 'extensions'),
      fileSystem
    ),
    presets: await listTemplateLayerDirs(
      input.presetsRoot ?? path.join(specifyRoot, 'presets'),
      fileSystem
    ),
    projectRoot: input.projectOverrideRoot ?? path.join(specifyRoot, 'templates', 'overrides')
  }, fileSystem);
};

export const renderTemplateSourceDiagnostics = (
  diagnostics: readonly TemplateSourceDiagnostic[],
  options: RenderTemplateSourceDiagnosticsOptions = {}
): string => {
  const visibleDiagnostics = options.includeUnshadowed
    ? diagnostics
    : diagnostics.filter(diagnostic => diagnostic.shadowedSources.length > 0);
  const lines: string[] = [];

  if (options.heading !== '') {
    lines.push(options.heading ?? '模板来源诊断');
  }

  if (visibleDiagnostics.length === 0) {
    lines.push('未发现模板覆盖。');
    return lines.join('\n');
  }

  for (const diagnostic of visibleDiagnostics) {
    const shadowed = diagnostic.shadowedSources.map(formatSourceLabel).join(', ');
    lines.push(`- ${diagnostic.relativePath}: 最终 ${formatSourceLabel(diagnostic.finalSource)}${shadowed ? `，覆盖 ${shadowed}` : ''}`);
  }

  return lines.join('\n');
};

export const writeResolvedTemplates = async (
  templates: readonly ResolvedTemplate[],
  targetRoot: string,
  fileSystem: TemplateFileSystem = nodeTemplateFileSystem
): Promise<void> => {
  for (const template of templates) {
    const targetPath = path.join(targetRoot, ...template.relativePath.split('/'));
    await fileSystem.ensureDir(path.dirname(targetPath));
    await fileSystem.writeFile(targetPath, template.content);
  }
};
