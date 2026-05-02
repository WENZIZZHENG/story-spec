import path from 'node:path';

export const PLUGIN_TYPES = [
  'feature',
  'expert',
  'workflow',
  'knowledge',
  'style'
] as const;

export type PluginType = typeof PLUGIN_TYPES[number];

export const PLUGIN_HOOK_POINTS = [
  'post-init',
  'pre-prompt-compile',
  'post-tasks-generate',
  'pre-write-validate'
] as const;

export type PluginHookPoint = typeof PLUGIN_HOOK_POINTS[number];
export type PluginHookStrategy = 'append' | 'prepend' | 'replace-marker';

export interface PluginCapabilityFile {
  id: string;
  file: string;
  name?: string;
  description?: string;
  target?: string;
  title?: string;
}

export interface PluginCommand extends PluginCapabilityFile {}

export interface PluginTemplate extends PluginCapabilityFile {}

export interface PluginKnowledge extends PluginCapabilityFile {}

export interface PluginTrackingRule extends PluginCapabilityFile {}

export interface PluginExpert extends PluginCapabilityFile {
  title?: string;
}

export interface PluginHook {
  id: string;
  point: PluginHookPoint;
  source?: string;
  target?: string;
  marker?: string;
  strategy: PluginHookStrategy;
}

export interface PluginManifest {
  name: string;
  version: string;
  type: PluginType;
  description?: string;
  displayName?: string;
  author?: string;
  homepage?: string;
  commands: PluginCommand[];
  templates: PluginTemplate[];
  knowledge: PluginKnowledge[];
  trackingRules: PluginTrackingRule[];
  experts: PluginExpert[];
  hooks: PluginHook[];
  dependencies?: {
    core?: string;
  };
  installation?: {
    files?: Array<{
      source: string;
      target: string;
      prefix?: string;
    }>;
    message?: string;
  };
  features: string[];
}

export interface PluginManifestIssue {
  path: string;
  message: string;
}

export interface ParsePluginManifestResult {
  manifest?: PluginManifest;
  issues: PluginManifestIssue[];
}

const PLUGIN_TYPE_SET = new Set<string>(PLUGIN_TYPES);
const HOOK_POINT_SET = new Set<string>(PLUGIN_HOOK_POINTS);
const HOOK_STRATEGIES = new Set<PluginHookStrategy>(['append', 'prepend', 'replace-marker']);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const issue = (pathName: string, message: string): PluginManifestIssue => ({
  path: pathName,
  message
});

const slugFromFile = (filePath: string): string => {
  const base = path.basename(filePath, path.extname(filePath));
  return base || filePath.replace(/[\\/]/g, '-');
};

const normalizeCapabilityFile = (
  value: unknown,
  pathName: string,
  issues: PluginManifestIssue[],
  options: {
    requireId?: boolean;
    requireDescription?: boolean;
    requireTitle?: boolean;
  } = {}
): PluginCapabilityFile => {
  if (isNonEmptyString(value)) {
    return {
      id: slugFromFile(value),
      file: value
    };
  }

  if (!isRecord(value)) {
    issues.push(issue(pathName, '插件能力项必须是对象或文件路径字符串'));
    return { id: '', file: '' };
  }

  const file = value.file;
  const id = value.id;
  const name = value.name;
  const description = value.description;
  const title = value.title;
  const target = value.target;

  if (options.requireId && !isNonEmptyString(id)) {
    issues.push(issue(`${pathName}.id`, '插件能力 id 不能为空'));
  }

  if (!isNonEmptyString(file)) {
    issues.push(issue(`${pathName}.file`, '插件能力 file 不能为空'));
  }

  if (options.requireDescription && !isNonEmptyString(description)) {
    issues.push(issue(`${pathName}.description`, '插件命令 description 不能为空'));
  }

  if (options.requireTitle && !isNonEmptyString(title)) {
    issues.push(issue(`${pathName}.title`, '插件专家 title 不能为空'));
  }

  return {
    id: isNonEmptyString(id)
      ? id
      : (isNonEmptyString(file) ? slugFromFile(file) : ''),
    file: isNonEmptyString(file) ? file : '',
    ...(isNonEmptyString(name) ? { name } : {}),
    ...(isNonEmptyString(description) ? { description } : {}),
    ...(isNonEmptyString(title) ? { title } : {}),
    ...(isNonEmptyString(target) ? { target } : {})
  };
};

const normalizeCapabilityArray = (
  value: unknown,
  pathName: string,
  issues: PluginManifestIssue[],
  options?: Parameters<typeof normalizeCapabilityFile>[3]
): PluginCapabilityFile[] => {
  if (value === undefined) {
    return [];
  }

  if (!Array.isArray(value)) {
    issues.push(issue(pathName, '插件能力字段必须是数组'));
    return [];
  }

  return value.map((entry, index) => normalizeCapabilityFile(entry, `${pathName}[${index}]`, issues, options));
};

const normalizeHooks = (value: unknown, issues: PluginManifestIssue[]): PluginHook[] => {
  if (value === undefined) {
    return [];
  }

  if (!Array.isArray(value)) {
    issues.push(issue('plugin.hooks', '插件 hooks 必须是数组'));
    return [];
  }

  return value.map((entry, index) => {
    const pathName = `plugin.hooks[${index}]`;
    if (!isRecord(entry)) {
      issues.push(issue(pathName, '插件 hook 必须是对象'));
      return { id: '', point: 'post-init', strategy: 'append' } satisfies PluginHook;
    }

    const id = entry.id;
    const point = entry.point;
    const strategy = entry.strategy;
    const source = entry.source;
    const target = entry.target;
    const marker = entry.marker;

    if (!isNonEmptyString(id)) {
      issues.push(issue(`${pathName}.id`, '插件 hook id 不能为空'));
    }

    if (!isNonEmptyString(point) || !HOOK_POINT_SET.has(point)) {
      issues.push(issue(`${pathName}.point`, `插件 hook point 必须是 ${PLUGIN_HOOK_POINTS.join('/')}`));
    }

    if (strategy !== undefined && (!isNonEmptyString(strategy) || !HOOK_STRATEGIES.has(strategy as PluginHookStrategy))) {
      issues.push(issue(`${pathName}.strategy`, '插件 hook strategy 必须是 append/prepend/replace-marker'));
    }

    return {
      id: isNonEmptyString(id) ? id : '',
      point: HOOK_POINT_SET.has(String(point)) ? point as PluginHookPoint : 'post-init',
      strategy: isNonEmptyString(strategy) && HOOK_STRATEGIES.has(strategy as PluginHookStrategy)
        ? strategy as PluginHookStrategy
        : 'append',
      ...(isNonEmptyString(source) ? { source } : {}),
      ...(isNonEmptyString(target) ? { target } : {}),
      ...(isNonEmptyString(marker) ? { marker } : {})
    };
  });
};

const readOptionalString = (value: unknown): string | undefined =>
  isNonEmptyString(value) ? value : undefined;

export const parsePluginManifest = (raw: unknown): ParsePluginManifestResult => {
  const issues: PluginManifestIssue[] = [];

  if (!isRecord(raw)) {
    return {
      issues: [issue('plugin', '插件 manifest 必须是对象')]
    };
  }

  if (!isNonEmptyString(raw.name)) {
    issues.push(issue('plugin.name', '插件 name 不能为空'));
  }

  if (!isNonEmptyString(raw.version)) {
    issues.push(issue('plugin.version', '插件 version 不能为空'));
  }

  if (!isNonEmptyString(raw.type) || !PLUGIN_TYPE_SET.has(raw.type)) {
    issues.push(issue('plugin.type', `插件 type 必须是 ${PLUGIN_TYPES.join('/')}`));
  }

  const commands = normalizeCapabilityArray(raw.commands, 'plugin.commands', issues, {
    requireId: true,
    requireDescription: true
  }) as PluginCommand[];
  const templates = normalizeCapabilityArray(raw.templates, 'plugin.templates', issues) as PluginTemplate[];
  const knowledge = normalizeCapabilityArray(raw.knowledge, 'plugin.knowledge', issues) as PluginKnowledge[];
  const trackingRules = normalizeCapabilityArray(raw.trackingRules, 'plugin.trackingRules', issues) as PluginTrackingRule[];
  const experts = normalizeCapabilityArray(raw.experts, 'plugin.experts', issues, {
    requireId: true,
    requireTitle: false
  }) as PluginExpert[];
  const hooks = normalizeHooks(raw.hooks, issues);
  const features = Array.isArray(raw.features)
    ? raw.features.filter(isNonEmptyString)
    : [];

  if (issues.length > 0) {
    return { issues };
  }

  return {
    issues,
    manifest: {
      name: raw.name as string,
      version: raw.version as string,
      type: raw.type as PluginType,
      commands,
      templates,
      knowledge,
      trackingRules,
      experts,
      hooks,
      features,
      ...(readOptionalString(raw.description) ? { description: raw.description as string } : {}),
      ...(readOptionalString(raw.displayName) ? { displayName: raw.displayName as string } : {}),
      ...(readOptionalString(raw.author) ? { author: raw.author as string } : {}),
      ...(readOptionalString(raw.homepage) ? { homepage: raw.homepage as string } : {}),
      ...(isRecord(raw.dependencies) ? { dependencies: raw.dependencies as PluginManifest['dependencies'] } : {}),
      ...(isRecord(raw.installation) ? { installation: raw.installation as PluginManifest['installation'] } : {})
    }
  };
};
