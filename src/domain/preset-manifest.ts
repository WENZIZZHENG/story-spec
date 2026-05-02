import yaml from 'js-yaml';

export interface PresetWorldFactRequirement {
  id: string;
  title: string;
  type: string;
  storyFunction: string;
  constraints: string[];
  description?: string;
}

export interface PresetCharacterRole {
  id: string;
  name: string;
  function: string;
  required: boolean;
}

export interface PresetPacingTemplate {
  id: string;
  name: string;
  description: string;
}

export interface PresetCommonMistake {
  id: string;
  description: string;
  suggestedAction: string;
}

export interface PresetValidateRule {
  id: string;
  type: string;
  description: string;
}

export interface PresetManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  genre: string;
  priority: number;
  requiredWorldFacts: PresetWorldFactRequirement[];
  characterRoles: PresetCharacterRole[];
  pacingTemplates: PresetPacingTemplate[];
  commonMistakes: PresetCommonMistake[];
  reviewerWeights: Record<string, number>;
  validateRules: PresetValidateRule[];
}

export interface PresetManifestIssue {
  severity: 'error' | 'warning';
  code:
    | 'INVALID_PRESET_MANIFEST'
    | 'MISSING_PRESET_FIELD'
    | 'INVALID_PRESET_FIELD';
  path: string;
  message: string;
}

export interface ParsePresetManifestResult {
  manifest?: PresetManifest;
  issues: PresetManifestIssue[];
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const toStringArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter(isNonEmptyString).map(item => item.trim())
    : [];

const issue = (
  code: PresetManifestIssue['code'],
  path: string,
  message: string,
  severity: PresetManifestIssue['severity'] = 'error'
): PresetManifestIssue => ({
  code,
  path,
  message,
  severity
});

const readRequiredString = (
  record: Record<string, unknown>,
  field: string,
  path: string,
  issues: PresetManifestIssue[]
): string => {
  const value = record[field];
  if (!isNonEmptyString(value)) {
    issues.push(issue('MISSING_PRESET_FIELD', `${path}.${field}`, `PresetManifest 缺少 ${field}`));
    return '';
  }

  return value.trim();
};

const readOptionalString = (
  value: unknown,
  fallback = ''
): string => isNonEmptyString(value) ? value.trim() : fallback;

const readPriority = (
  value: unknown,
  issues: PresetManifestIssue[]
): number => {
  if (value === undefined) {
    return 200;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    issues.push(issue('INVALID_PRESET_FIELD', 'preset.priority', 'PresetManifest priority 必须是数字'));
    return 200;
  }

  return parsed;
};

const parseRequiredWorldFacts = (
  value: unknown,
  issues: PresetManifestIssue[]
): PresetWorldFactRequirement[] => {
  if (value === undefined) {
    return [];
  }

  if (!Array.isArray(value)) {
    issues.push(issue('INVALID_PRESET_FIELD', 'preset.requiredWorldFacts', 'requiredWorldFacts 必须是数组'));
    return [];
  }

  return value.flatMap((entry, index) => {
    const path = `preset.requiredWorldFacts[${index}]`;
    if (!isRecord(entry)) {
      issues.push(issue('INVALID_PRESET_FIELD', path, 'requiredWorldFacts 项必须是对象'));
      return [];
    }

    const id = readRequiredString(entry, 'id', path, issues);
    const title = readRequiredString(entry, 'title', path, issues);
    const storyFunction = readRequiredString(entry, 'storyFunction', path, issues);
    const constraints = toStringArray(entry.constraints);
    if (constraints.length === 0) {
      issues.push(issue('MISSING_PRESET_FIELD', `${path}.constraints`, 'requiredWorldFacts 必须声明 constraints'));
    }

    if (!id || !title || !storyFunction || constraints.length === 0) {
      return [];
    }

    return [{
      id,
      title,
      storyFunction,
      constraints,
      type: readOptionalString(entry.type, 'rule'),
      description: readOptionalString(entry.description) || undefined
    }];
  });
};

const parseCharacterRoles = (
  value: unknown,
  issues: PresetManifestIssue[]
): PresetCharacterRole[] => {
  if (value === undefined) {
    return [];
  }

  if (!Array.isArray(value)) {
    issues.push(issue('INVALID_PRESET_FIELD', 'preset.characterRoles', 'characterRoles 必须是数组'));
    return [];
  }

  return value.flatMap((entry, index) => {
    const path = `preset.characterRoles[${index}]`;
    if (!isRecord(entry)) {
      issues.push(issue('INVALID_PRESET_FIELD', path, 'characterRoles 项必须是对象'));
      return [];
    }

    const id = readRequiredString(entry, 'id', path, issues);
    const name = readRequiredString(entry, 'name', path, issues);
    const roleFunction = readRequiredString(entry, 'function', path, issues);
    if (!id || !name || !roleFunction) {
      return [];
    }

    return [{
      id,
      name,
      function: roleFunction,
      required: entry.required !== false
    }];
  });
};

const parseNamedDescriptions = <T extends { id: string; name: string; description: string }>(
  value: unknown,
  field: 'pacingTemplates',
  issues: PresetManifestIssue[]
): T[] => {
  if (value === undefined) {
    return [];
  }

  if (!Array.isArray(value)) {
    issues.push(issue('INVALID_PRESET_FIELD', `preset.${field}`, `${field} 必须是数组`));
    return [];
  }

  return value.flatMap((entry, index) => {
    const path = `preset.${field}[${index}]`;
    if (!isRecord(entry)) {
      issues.push(issue('INVALID_PRESET_FIELD', path, `${field} 项必须是对象`));
      return [];
    }

    const id = readRequiredString(entry, 'id', path, issues);
    const name = readRequiredString(entry, 'name', path, issues);
    const description = readRequiredString(entry, 'description', path, issues);
    return id && name && description ? [{ id, name, description } as T] : [];
  });
};

const parseCommonMistakes = (
  value: unknown,
  issues: PresetManifestIssue[]
): PresetCommonMistake[] => {
  if (value === undefined) {
    return [];
  }

  if (!Array.isArray(value)) {
    issues.push(issue('INVALID_PRESET_FIELD', 'preset.commonMistakes', 'commonMistakes 必须是数组'));
    return [];
  }

  return value.flatMap((entry, index) => {
    const path = `preset.commonMistakes[${index}]`;
    if (!isRecord(entry)) {
      issues.push(issue('INVALID_PRESET_FIELD', path, 'commonMistakes 项必须是对象'));
      return [];
    }

    const id = readRequiredString(entry, 'id', path, issues);
    const description = readRequiredString(entry, 'description', path, issues);
    const suggestedAction = readRequiredString(entry, 'suggestedAction', path, issues);
    return id && description && suggestedAction ? [{ id, description, suggestedAction }] : [];
  });
};

const parseValidateRules = (
  value: unknown,
  issues: PresetManifestIssue[]
): PresetValidateRule[] => {
  if (value === undefined) {
    return [];
  }

  if (!Array.isArray(value)) {
    issues.push(issue('INVALID_PRESET_FIELD', 'preset.validateRules', 'validateRules 必须是数组'));
    return [];
  }

  return value.flatMap((entry, index) => {
    const path = `preset.validateRules[${index}]`;
    if (!isRecord(entry)) {
      issues.push(issue('INVALID_PRESET_FIELD', path, 'validateRules 项必须是对象'));
      return [];
    }

    const id = readRequiredString(entry, 'id', path, issues);
    const type = readRequiredString(entry, 'type', path, issues);
    const description = readRequiredString(entry, 'description', path, issues);
    return id && type && description ? [{ id, type, description }] : [];
  });
};

const parseReviewerWeights = (
  value: unknown,
  issues: PresetManifestIssue[]
): Record<string, number> => {
  if (value === undefined) {
    return {};
  }

  if (!isRecord(value)) {
    issues.push(issue('INVALID_PRESET_FIELD', 'preset.reviewerWeights', 'reviewerWeights 必须是对象'));
    return {};
  }

  const result: Record<string, number> = {};
  for (const [key, weight] of Object.entries(value)) {
    const parsed = Number(weight);
    if (!Number.isFinite(parsed)) {
      issues.push(issue('INVALID_PRESET_FIELD', `preset.reviewerWeights.${key}`, 'reviewer weight 必须是数字'));
      continue;
    }

    result[key] = parsed;
  }

  return result;
};

export const parsePresetManifest = (
  content: string,
  filePath = 'preset.yaml'
): ParsePresetManifestResult => {
  let document: unknown;
  try {
    document = yaml.load(content);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    return {
      issues: [issue('INVALID_PRESET_MANIFEST', filePath, `PresetManifest YAML 无法解析：${detail}`)]
    };
  }

  if (!isRecord(document)) {
    return {
      issues: [issue('INVALID_PRESET_MANIFEST', filePath, 'PresetManifest 顶层必须是对象')]
    };
  }

  const issues: PresetManifestIssue[] = [];
  const id = readRequiredString(document, 'id', 'preset', issues);
  const name = readRequiredString(document, 'name', 'preset', issues);
  const version = readRequiredString(document, 'version', 'preset', issues);
  const description = readRequiredString(document, 'description', 'preset', issues);
  const genre = readRequiredString(document, 'genre', 'preset', issues);
  const manifest: PresetManifest = {
    id,
    name,
    version,
    description,
    genre,
    priority: readPriority(document.priority, issues),
    requiredWorldFacts: parseRequiredWorldFacts(document.requiredWorldFacts, issues),
    characterRoles: parseCharacterRoles(document.characterRoles, issues),
    pacingTemplates: parseNamedDescriptions<PresetPacingTemplate>(document.pacingTemplates, 'pacingTemplates', issues),
    commonMistakes: parseCommonMistakes(document.commonMistakes, issues),
    reviewerWeights: parseReviewerWeights(document.reviewerWeights, issues),
    validateRules: parseValidateRules(document.validateRules, issues)
  };

  if (issues.length > 0) {
    return { issues };
  }

  return {
    manifest,
    issues
  };
};
