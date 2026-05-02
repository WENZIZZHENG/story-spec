import { load } from 'js-yaml';

export type CommandStage =
  | 'constitution'
  | 'specification'
  | 'planning'
  | 'tasking'
  | 'drafting'
  | 'analysis'
  | 'tracking'
  | 'review'
  | 'expert'
  | 'custom'
  | (string & {});

export type CommandScriptCapability =
  | 'create-constitution'
  | 'specify-story'
  | 'clarify-story'
  | 'plan-story'
  | 'generate-tasks'
  | 'check-writing-state'
  | 'analyze-story'
  | 'init-tracking'
  | 'track-progress'
  | 'check-timeline'
  | 'manage-relations'
  | 'run-checklist'
  | 'run-expert'
  | (string & {});

export interface CommandSpecArgument {
  hint?: string;
  required?: boolean;
}

export interface CommandSpecScript {
  capability: CommandScriptCapability;
  sh?: string;
  ps?: string;
}

export interface CommandSpecRisk {
  requiresTaskBoundary?: boolean;
  highRiskContentPolicy?: string;
}

export interface CommandSpec {
  id: string;
  title: string;
  stage: CommandStage;
  description: string;
  arguments?: CommandSpecArgument;
  requiredReads: string[];
  allowedWrites: string[];
  scripts?: {
    check?: CommandSpecScript;
    run?: CommandSpecScript;
  };
  risk?: CommandSpecRisk;
  sourcePath?: string;
}

export type CommandSpecIssueCode =
  | 'INVALID_COMMAND_SPEC'
  | 'MISSING_COMMAND_FIELD'
  | 'INVALID_COMMAND_FIELD';

export interface CommandSpecIssue {
  code: CommandSpecIssueCode;
  path: string;
  message: string;
}

export interface ParseCommandSpecResult {
  spec?: CommandSpec;
  issues: CommandSpecIssue[];
}

type RecordValue = Record<string, unknown>;

const REQUIRED_STRING_FIELDS = ['id', 'title', 'stage', 'description'] as const;
const REQUIRED_STRING_ARRAY_FIELDS = ['requiredReads', 'allowedWrites'] as const;

const isRecord = (value: unknown): value is RecordValue => (
  typeof value === 'object' && value !== null && !Array.isArray(value)
);

const addIssue = (
  issues: CommandSpecIssue[],
  code: CommandSpecIssueCode,
  path: string,
  message: string
): void => {
  issues.push({ code, path, message });
};

const readRequiredString = (
  raw: RecordValue,
  field: typeof REQUIRED_STRING_FIELDS[number],
  issues: CommandSpecIssue[],
  path = field
): string | undefined => {
  const value = raw[field];
  if (value === undefined) {
    addIssue(issues, 'MISSING_COMMAND_FIELD', path, `CommandSpec 缺少必填字段 ${path}`);
    return undefined;
  }

  if (typeof value !== 'string' || value.trim() === '') {
    addIssue(issues, 'INVALID_COMMAND_FIELD', path, `CommandSpec 字段 ${path} 必须是非空字符串`);
    return undefined;
  }

  return value;
};

const readRequiredCapability = (
  raw: RecordValue,
  path: string,
  issues: CommandSpecIssue[]
): string | undefined => {
  const value = raw.capability;
  if (value === undefined) {
    addIssue(issues, 'MISSING_COMMAND_FIELD', path, `CommandSpec 字段 ${path} 是必填非空字符串`);
    return undefined;
  }

  if (typeof value !== 'string' || value.trim() === '') {
    addIssue(issues, 'INVALID_COMMAND_FIELD', path, `CommandSpec 字段 ${path} 必须是非空字符串`);
    return undefined;
  }

  return value;
};

const readOptionalString = (
  raw: RecordValue,
  field: string,
  issues: CommandSpecIssue[],
  path = field
): string | undefined => {
  const value = raw[field];
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== 'string') {
    addIssue(issues, 'INVALID_COMMAND_FIELD', path, `CommandSpec 字段 ${path} 必须是字符串`);
    return undefined;
  }

  return value;
};

const readOptionalBoolean = (
  raw: RecordValue,
  field: string,
  issues: CommandSpecIssue[],
  path = field
): boolean | undefined => {
  const value = raw[field];
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== 'boolean') {
    addIssue(issues, 'INVALID_COMMAND_FIELD', path, `CommandSpec 字段 ${path} 必须是布尔值`);
    return undefined;
  }

  return value;
};

const readRequiredStringArray = (
  raw: RecordValue,
  field: typeof REQUIRED_STRING_ARRAY_FIELDS[number],
  issues: CommandSpecIssue[]
): string[] | undefined => {
  const value = raw[field];
  if (value === undefined) {
    addIssue(issues, 'MISSING_COMMAND_FIELD', field, `CommandSpec 缺少必填字段 ${field}`);
    return undefined;
  }

  if (!Array.isArray(value)) {
    addIssue(issues, 'INVALID_COMMAND_FIELD', field, `CommandSpec 字段 ${field} 必须是字符串数组`);
    return undefined;
  }

  const result: string[] = [];
  value.forEach((item, index) => {
    if (typeof item !== 'string' || item.trim() === '') {
      addIssue(
        issues,
        'INVALID_COMMAND_FIELD',
        `${field}[${index}]`,
        `CommandSpec 字段 ${field}[${index}] 必须是非空字符串`
      );
      return;
    }

    result.push(item);
  });

  return result;
};

const readArguments = (
  raw: RecordValue,
  issues: CommandSpecIssue[]
): CommandSpecArgument | undefined => {
  const value = raw.arguments;
  if (value === undefined) {
    return undefined;
  }

  if (!isRecord(value)) {
    addIssue(issues, 'INVALID_COMMAND_FIELD', 'arguments', 'CommandSpec 字段 arguments 必须是对象');
    return undefined;
  }

  const result: CommandSpecArgument = {};
  const hint = readOptionalString(value, 'hint', issues, 'arguments.hint');
  const required = readOptionalBoolean(value, 'required', issues, 'arguments.required');
  if (hint !== undefined) {
    result.hint = hint;
  }
  if (required !== undefined) {
    result.required = required;
  }

  return result;
};

const readScript = (
  raw: RecordValue,
  path: string,
  issues: CommandSpecIssue[]
): CommandSpecScript | undefined => {
  const capability = readRequiredCapability(raw, `${path}.capability`, issues);
  const sh = readOptionalString(raw, 'sh', issues, `${path}.sh`);
  const ps = readOptionalString(raw, 'ps', issues, `${path}.ps`);
  if (capability === undefined) {
    return undefined;
  }

  return {
    capability,
    ...sh !== undefined ? { sh } : {},
    ...ps !== undefined ? { ps } : {}
  };
};

const readScripts = (
  raw: RecordValue,
  issues: CommandSpecIssue[]
): CommandSpec['scripts'] | undefined => {
  const value = raw.scripts;
  if (value === undefined) {
    return undefined;
  }

  if (!isRecord(value)) {
    addIssue(issues, 'INVALID_COMMAND_FIELD', 'scripts', 'CommandSpec 字段 scripts 必须是对象');
    return undefined;
  }

  const result: CommandSpec['scripts'] = {};
  for (const key of ['check', 'run'] as const) {
    const scriptValue = value[key];
    if (scriptValue === undefined) {
      continue;
    }

    if (!isRecord(scriptValue)) {
      addIssue(issues, 'INVALID_COMMAND_FIELD', `scripts.${key}`, `CommandSpec 字段 scripts.${key} 必须是对象`);
      continue;
    }

    const script = readScript(scriptValue, `scripts.${key}`, issues);
    if (script) {
      result[key] = script;
    }
  }

  return Object.keys(result).length > 0 ? result : undefined;
};

const readRisk = (
  raw: RecordValue,
  issues: CommandSpecIssue[]
): CommandSpecRisk | undefined => {
  const value = raw.risk;
  if (value === undefined) {
    return undefined;
  }

  if (!isRecord(value)) {
    addIssue(issues, 'INVALID_COMMAND_FIELD', 'risk', 'CommandSpec 字段 risk 必须是对象');
    return undefined;
  }

  const result: CommandSpecRisk = {};
  const requiresTaskBoundary = readOptionalBoolean(
    value,
    'requiresTaskBoundary',
    issues,
    'risk.requiresTaskBoundary'
  );
  const highRiskContentPolicy = readOptionalString(
    value,
    'highRiskContentPolicy',
    issues,
    'risk.highRiskContentPolicy'
  );

  if (requiresTaskBoundary !== undefined) {
    result.requiresTaskBoundary = requiresTaskBoundary;
  }
  if (highRiskContentPolicy !== undefined) {
    result.highRiskContentPolicy = highRiskContentPolicy;
  }

  return result;
};

export const parseCommandSpec = (
  yamlSource: string,
  sourcePath = 'command-spec.yaml'
): ParseCommandSpecResult => {
  const issues: CommandSpecIssue[] = [];
  let parsed: unknown;

  try {
    parsed = load(yamlSource);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      issues: [{
        code: 'INVALID_COMMAND_SPEC',
        path: sourcePath,
        message: `CommandSpec YAML 无法解析：${message}`
      }]
    };
  }

  if (!isRecord(parsed)) {
    return {
      issues: [{
        code: 'INVALID_COMMAND_SPEC',
        path: sourcePath,
        message: 'CommandSpec YAML 顶层必须是对象'
      }]
    };
  }

  const id = readRequiredString(parsed, 'id', issues);
  const title = readRequiredString(parsed, 'title', issues);
  const stage = readRequiredString(parsed, 'stage', issues);
  const description = readRequiredString(parsed, 'description', issues);
  const requiredReads = readRequiredStringArray(parsed, 'requiredReads', issues);
  const allowedWrites = readRequiredStringArray(parsed, 'allowedWrites', issues);
  const argumentSpec = readArguments(parsed, issues);
  const scripts = readScripts(parsed, issues);
  const risk = readRisk(parsed, issues);

  if (
    issues.length > 0 ||
    id === undefined ||
    title === undefined ||
    stage === undefined ||
    description === undefined ||
    requiredReads === undefined ||
    allowedWrites === undefined
  ) {
    return { issues };
  }

  return {
    spec: {
      id,
      title,
      stage,
      description,
      ...argumentSpec ? { arguments: argumentSpec } : {},
      requiredReads,
      allowedWrites,
      ...scripts ? { scripts } : {},
      ...risk ? { risk } : {},
      sourcePath
    },
    issues
  };
};
