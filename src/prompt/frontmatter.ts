type FrontmatterValue = string | number | boolean | null | FrontmatterObject | FrontmatterValue[];

interface FrontmatterObject {
  [key: string]: FrontmatterValue;
}

export interface CommandTemplateFrontmatter {
  description?: string;
  argumentHint?: string;
  allowedTools?: string;
  model?: string;
  scripts: Record<string, string>;
  raw: FrontmatterObject;
}

export interface ParsedCommandTemplate {
  frontmatter: CommandTemplateFrontmatter;
  body: string;
  hasFrontmatter: boolean;
}

const EMPTY_FRONTMATTER: CommandTemplateFrontmatter = {
  scripts: {},
  raw: {}
};

const FRONTMATTER_PATTERN = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n)?/;

const asString = (value: FrontmatterValue | undefined): string | undefined => {
  if (typeof value === 'string') {
    return value;
  }

  if (value === undefined || value === null) {
    return undefined;
  }

  return String(value);
};

const asStringRecord = (value: FrontmatterValue | undefined): Record<string, string> => {
  const objectValue = value && typeof value === 'object' && !Array.isArray(value)
    ? value as FrontmatterObject
    : {};
  const result: Record<string, string> = {};

  for (const [key, itemValue] of Object.entries(objectValue)) {
    const stringValue = asString(itemValue);
    if (stringValue !== undefined) {
      result[key] = stringValue;
    }
  }

  return result;
};

const unquote = (value: string): string => {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }

  return trimmed;
};

const extractRawScalar = (source: string, key: string): string | undefined => {
  const pattern = new RegExp(`^${key}:\\s*(.*)$`, 'm');
  const match = source.match(pattern);
  return match?.[1]?.trim();
};

const parseFrontmatterSource = (source: string): FrontmatterObject => {
  const raw: FrontmatterObject = {};
  let currentNestedKey: string | undefined;

  for (const line of source.split(/\r?\n/)) {
    if (!line.trim()) {
      continue;
    }

    const nestedMatch = line.match(/^\s+([A-Za-z0-9_-]+):\s*(.*)$/);
    if (currentNestedKey && nestedMatch) {
      const nested = raw[currentNestedKey];
      if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
        nested[nestedMatch[1]] = unquote(nestedMatch[2]);
      }
      continue;
    }

    const topLevelMatch = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!topLevelMatch) {
      currentNestedKey = undefined;
      continue;
    }

    const [, key, value] = topLevelMatch;
    if (value === '') {
      raw[key] = {};
      currentNestedKey = key;
    } else {
      raw[key] = unquote(value);
      currentNestedKey = undefined;
    }
  }

  return raw;
};

const normalizeFrontmatter = (
  raw: FrontmatterObject,
  source: string
): CommandTemplateFrontmatter => {
  const argumentHint = extractRawScalar(source, 'argument-hint') ?? asString(raw['argument-hint']);

  return {
    description: asString(raw.description),
    argumentHint,
    allowedTools: asString(raw['allowed-tools']),
    model: asString(raw.model),
    scripts: asStringRecord(raw.scripts),
    raw: {
      ...raw,
      ...argumentHint ? { 'argument-hint': argumentHint } : {}
    }
  };
};

export const parseCommandTemplateFrontmatter = (content: string): CommandTemplateFrontmatter => {
  const match = content.match(FRONTMATTER_PATTERN);
  if (!match?.[1]) {
    return { ...EMPTY_FRONTMATTER };
  }

  const raw = parseFrontmatterSource(match[1]);
  return normalizeFrontmatter(raw, match[1]);
};

export const parseCommandTemplate = (content: string): ParsedCommandTemplate => {
  const match = content.match(FRONTMATTER_PATTERN);
  if (!match) {
    return {
      frontmatter: { ...EMPTY_FRONTMATTER },
      body: content,
      hasFrontmatter: false
    };
  }

  return {
    frontmatter: parseCommandTemplateFrontmatter(content),
    body: content.slice(match[0].length),
    hasFrontmatter: true
  };
};
