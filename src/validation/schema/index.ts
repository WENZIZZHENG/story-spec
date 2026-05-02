import type { AIPlatformConfig } from '../../utils/ai-platforms.js';
import type {
  WritingTask,
  WritingTaskPriority,
  WritingTaskStatus
} from '../../domain/story-artifact.js';
import {
  parsePluginManifest,
  type PluginManifest
} from '../../domain/plugin-manifest.js';

export type ValidationSeverity = 'error' | 'warning' | 'info';

export interface ValidationIssue {
  severity: ValidationSeverity;
  code:
    | 'DUPLICATE_AI_PLATFORM'
    | 'INVALID_AI_PLATFORM_FIELD'
    | 'INVALID_AI_COMMAND_PREFIX'
    | 'INVALID_TRACKING_DOCUMENT'
    | 'INVALID_TASK_ID'
    | 'MISSING_TASK_TITLE'
    | 'INVALID_TASK_STATUS'
    | 'INVALID_TASK_PRIORITY'
    | 'MISSING_TASK_OUTPUT'
    | 'MISSING_PLUGIN_NAME'
    | 'MISSING_PLUGIN_VERSION'
    | 'INVALID_PLUGIN_TYPE'
    | 'INVALID_PLUGIN_MANIFEST'
    | 'INVALID_PLUGIN_COMMAND';
  path: string;
  message: string;
}

const VALID_COMMAND_PREFIXES = new Set(['/', '/novel.', '/novel:', '/novel-']);
const VALID_TASK_STATUSES = new Set<WritingTaskStatus>(['todo', 'done']);
const VALID_TASK_PRIORITIES = new Set<WritingTaskPriority>(['P0', 'P1', 'P2', 'P3', 'PX']);

const issue = (
  code: ValidationIssue['code'],
  path: string,
  message: string,
  severity: ValidationSeverity = 'error'
): ValidationIssue => ({
  code,
  path,
  message,
  severity
});

const isNonEmptyString = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const validateAIPlatformRegistry = (platforms: readonly unknown[]): ValidationIssue[] => {
  const issues: ValidationIssue[] = [];
  const names = new Set<string>();

  platforms.forEach((platform, index) => {
    const pathPrefix = `aiPlatforms[${index}]`;
    if (!isRecord(platform)) {
      issues.push(issue('INVALID_AI_PLATFORM_FIELD', pathPrefix, 'AI 平台配置必须是对象'));
      return;
    }

    const name = platform.name;
    if (!isNonEmptyString(name)) {
      issues.push(issue('INVALID_AI_PLATFORM_FIELD', `${pathPrefix}.name`, 'AI 平台 name 不能为空'));
    } else if (names.has(name)) {
      issues.push(issue('DUPLICATE_AI_PLATFORM', `${pathPrefix}.name`, `AI 平台重复: ${name}`));
    } else {
      names.add(name);
    }

    (['dir', 'commandsDir', 'displayName', 'distDir'] satisfies Array<keyof AIPlatformConfig>).forEach(field => {
      if (!isNonEmptyString(platform[field])) {
        issues.push(issue('INVALID_AI_PLATFORM_FIELD', `${pathPrefix}.${field}`, `AI 平台 ${field} 不能为空`));
      }
    });

    if (!VALID_COMMAND_PREFIXES.has(String(platform.commandPrefix))) {
      issues.push(issue('INVALID_AI_COMMAND_PREFIX', `${pathPrefix}.commandPrefix`, 'AI 命令前缀不在允许范围内'));
    }
  });

  return issues;
};

export const validateTrackingDocument = (document: unknown, filePath: string): ValidationIssue[] => {
  if (!isRecord(document)) {
    return [issue('INVALID_TRACKING_DOCUMENT', filePath, 'tracking JSON 顶层必须是对象')];
  }

  return [];
};

export const validateWritingTask = (task: unknown): ValidationIssue[] => {
  const issues: ValidationIssue[] = [];

  if (!isRecord(task)) {
    return [issue('INVALID_TASK_ID', 'task', '写作任务必须是对象')];
  }

  if (!isNonEmptyString(task.id) || !/^T\d+$/i.test(task.id)) {
    issues.push(issue('INVALID_TASK_ID', 'task.id', '任务 id 必须形如 T001'));
  }

  if (!isNonEmptyString(task.title)) {
    issues.push(issue('MISSING_TASK_TITLE', 'task.title', '任务标题不能为空'));
  }

  if (!VALID_TASK_STATUSES.has(task.status as WritingTaskStatus)) {
    issues.push(issue('INVALID_TASK_STATUS', 'task.status', '任务状态必须是 todo 或 done'));
  }

  if (!VALID_TASK_PRIORITIES.has(task.priority as WritingTaskPriority)) {
    issues.push(issue('INVALID_TASK_PRIORITY', 'task.priority', '任务优先级必须是 P0/P1/P2/P3/PX'));
  }

  if (!Array.isArray((task as Partial<WritingTask>).outputs) || (task as Partial<WritingTask>).outputs?.length === 0) {
    issues.push(issue('MISSING_TASK_OUTPUT', 'task.outputs', '任务必须声明至少一个输出路径'));
  }

  return issues;
};

export const validatePluginManifest = (manifest: unknown): ValidationIssue[] =>
  parsePluginManifest(manifest).issues.map(pluginIssue => {
    if (pluginIssue.path === 'plugin.name') {
      return issue('MISSING_PLUGIN_NAME', pluginIssue.path, pluginIssue.message);
    }

    if (pluginIssue.path === 'plugin.version') {
      return issue('MISSING_PLUGIN_VERSION', pluginIssue.path, pluginIssue.message);
    }

    if (pluginIssue.path === 'plugin.type') {
      return issue('INVALID_PLUGIN_TYPE', pluginIssue.path, pluginIssue.message);
    }

    if (pluginIssue.path.startsWith('plugin.commands')) {
      return issue('INVALID_PLUGIN_COMMAND', pluginIssue.path, pluginIssue.message);
    }

    return issue('INVALID_PLUGIN_MANIFEST', pluginIssue.path, pluginIssue.message);
  });

export type { PluginManifest };
