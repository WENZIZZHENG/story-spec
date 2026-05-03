import yaml from 'js-yaml';

export type WorldFactStatus = 'draft' | 'confirmed' | 'deprecated';
export type CanonFactStatus = 'draft' | 'confirmed' | 'deprecated';

export interface CreativeFactSource {
  confirmedByUser: boolean;
  aiSuggested: boolean;
  needsClarification: string[];
}

export interface WorldFact {
  id: string;
  title: string;
  type: string;
  summary: string;
  storyFunction: string;
  constraints: string[];
  sourcePaths: string[];
  status: WorldFactStatus;
  source: CreativeFactSource;
}

export interface CanonEvidence {
  path: string;
  quote?: string;
}

export interface CanonFact {
  id: string;
  summary: string;
  type: string;
  evidence: CanonEvidence[];
  affectedEntities: string[];
  status: CanonFactStatus;
  source: CreativeFactSource;
}

export interface WorldbuildingIssue {
  severity: 'error' | 'warning' | 'info';
  code:
    | 'INVALID_WORLD_DOCUMENT'
    | 'INVALID_WORLD_FACT'
    | 'MISSING_WORLD_FACT_FIELD'
    | 'MISSING_WORLD_FACT_SOURCE_PATH'
    | 'MISSING_WORLD_FACT_CONFIRMATION'
    | 'UNCONFIRMED_AI_WORLD_FACT'
    | 'INVALID_CANON_DOCUMENT'
    | 'INVALID_CANON_FACT'
    | 'MISSING_CANON_FACT_FIELD'
    | 'MISSING_CANON_FACT_CONFIRMATION'
    | 'UNCONFIRMED_AI_CANON_FACT';
  path: string;
  message: string;
}

export interface ParsedWorldDocument {
  worldFacts: WorldFact[];
  issues: WorldbuildingIssue[];
}

export interface ParsedCanonDocument {
  canonFacts: CanonFact[];
  issues: WorldbuildingIssue[];
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const toStringArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter(isNonEmptyString).map(item => item.trim())
    : [];

const readBoolean = (value: unknown): boolean => value === true;

const issue = (
  code: WorldbuildingIssue['code'],
  path: string,
  message: string,
  severity: WorldbuildingIssue['severity'] = 'warning'
): WorldbuildingIssue => ({
  code,
  path,
  message,
  severity
});

const readWorldFacts = (document: unknown): unknown[] => {
  if (!isRecord(document)) {
    return [];
  }

  if (Array.isArray(document.worldFacts)) {
    return document.worldFacts;
  }

  return [];
};

const readCanonFacts = (document: unknown): unknown[] => {
  if (!isRecord(document)) {
    return [];
  }

  if (Array.isArray(document.canonFacts)) {
    return document.canonFacts;
  }

  return [];
};

const parseYamlOrJson = (content: string): unknown => yaml.load(content);

const parseFactSource = (value: unknown): CreativeFactSource => {
  if (!isRecord(value)) {
    return {
      confirmedByUser: false,
      aiSuggested: false,
      needsClarification: []
    };
  }

  return {
    confirmedByUser: readBoolean(value.confirmedByUser),
    aiSuggested: readBoolean(value.aiSuggested),
    needsClarification: toStringArray(value.needsClarification)
  };
};

const factNeedsConfirmationWarning = (
  status: WorldFactStatus | CanonFactStatus,
  source: CreativeFactSource
): boolean => status === 'confirmed' && source.aiSuggested && !source.confirmedByUser;

const confirmedFactMissingSourceState = (
  status: WorldFactStatus | CanonFactStatus,
  source: CreativeFactSource
): boolean => status === 'confirmed' && !source.confirmedByUser && !source.aiSuggested;

export const parseWorldDocument = (
  content: string,
  filePath: string
): ParsedWorldDocument => {
  let document: unknown;
  try {
    document = parseYamlOrJson(content);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    return {
      worldFacts: [],
      issues: [issue('INVALID_WORLD_DOCUMENT', filePath, `world 文档无法解析：${detail}`, 'error')]
    };
  }

  if (!isRecord(document)) {
    return {
      worldFacts: [],
      issues: [issue('INVALID_WORLD_DOCUMENT', filePath, 'world 文档顶层必须是对象')]
    };
  }

  const issues: WorldbuildingIssue[] = [];
  const worldFacts: WorldFact[] = [];
  readWorldFacts(document).forEach((candidate, index) => {
    const basePath = `${filePath}#worldFacts[${index}]`;
    if (!isRecord(candidate)) {
      issues.push(issue('INVALID_WORLD_FACT', basePath, 'WorldFact 必须是对象'));
      return;
    }

    const missingFields = [
      ['id', candidate.id],
      ['title', candidate.title],
      ['summary', candidate.summary],
      ['storyFunction', candidate.storyFunction]
    ].filter(([, value]) => !isNonEmptyString(value));

    for (const [field] of missingFields) {
      issues.push(issue('MISSING_WORLD_FACT_FIELD', `${basePath}.${field}`, `WorldFact 缺少 ${field}`));
    }

    const constraints = toStringArray(candidate.constraints);
    if (constraints.length === 0) {
      issues.push(issue('MISSING_WORLD_FACT_FIELD', `${basePath}.constraints`, 'WorldFact 必须声明 constraints'));
    }

    if (missingFields.length > 0 || constraints.length === 0) {
      return;
    }

    const status = isNonEmptyString(candidate.status) ? candidate.status.trim() as WorldFactStatus : 'draft';
    const source = parseFactSource(candidate.source);
    if (status === 'confirmed' && toStringArray(candidate.sourcePaths).length === 0) {
      issues.push(issue(
        'MISSING_WORLD_FACT_SOURCE_PATH',
        `${basePath}.sourcePaths`,
        'confirmed WorldFact 必须声明 sourcePaths，指向用户确认记录、规格、正文或知识文件'
      ));
    }
    if (confirmedFactMissingSourceState(status, source)) {
      issues.push(issue(
        'MISSING_WORLD_FACT_CONFIRMATION',
        `${basePath}.source`,
        'confirmed WorldFact 必须声明来源确认状态：confirmedByUser 或 aiSuggested'
      ));
    }
    if (factNeedsConfirmationWarning(status, source)) {
      issues.push(issue(
        'UNCONFIRMED_AI_WORLD_FACT',
        `${basePath}.source`,
        'WorldFact 标记为 confirmed，但来源仍是未确认的 AI 建议；请先让用户确认或降级为 draft/pending'
      ));
    }

    worldFacts.push({
      id: String(candidate.id).trim(),
      title: String(candidate.title).trim(),
      type: isNonEmptyString(candidate.type) ? candidate.type.trim() : 'general',
      summary: String(candidate.summary).trim(),
      storyFunction: String(candidate.storyFunction).trim(),
      constraints,
      sourcePaths: toStringArray(candidate.sourcePaths),
      status,
      source
    });
  });

  return { worldFacts, issues };
};

const parseEvidence = (value: unknown): CanonEvidence[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap(item => {
    if (isNonEmptyString(item)) {
      return [{ path: item.trim() }];
    }

    if (isRecord(item) && isNonEmptyString(item.path)) {
      return [{
        path: item.path.trim(),
        quote: isNonEmptyString(item.quote) ? item.quote.trim() : undefined
      }];
    }

    return [];
  });
};

export const parseCanonDocument = (
  content: string,
  filePath: string
): ParsedCanonDocument => {
  let document: unknown;
  try {
    document = JSON.parse(content);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    return {
      canonFacts: [],
      issues: [issue('INVALID_CANON_DOCUMENT', filePath, `canon JSON 无法解析：${detail}`, 'error')]
    };
  }

  if (!isRecord(document)) {
    return {
      canonFacts: [],
      issues: [issue('INVALID_CANON_DOCUMENT', filePath, 'canon 文档顶层必须是对象')]
    };
  }

  const issues: WorldbuildingIssue[] = [];
  const canonFacts: CanonFact[] = [];
  readCanonFacts(document).forEach((candidate, index) => {
    const basePath = `${filePath}#canonFacts[${index}]`;
    if (!isRecord(candidate)) {
      issues.push(issue('INVALID_CANON_FACT', basePath, 'CanonFact 必须是对象'));
      return;
    }

    const missingFields = [
      ['id', candidate.id],
      ['summary', candidate.summary]
    ].filter(([, value]) => !isNonEmptyString(value));

    for (const [field] of missingFields) {
      issues.push(issue('MISSING_CANON_FACT_FIELD', `${basePath}.${field}`, `CanonFact 缺少 ${field}`));
    }

    const evidence = parseEvidence(candidate.evidence);
    if (evidence.length === 0) {
      issues.push(issue('MISSING_CANON_FACT_FIELD', `${basePath}.evidence`, 'CanonFact 必须声明 evidence'));
    }

    if (missingFields.length > 0 || evidence.length === 0) {
      return;
    }

    const status = isNonEmptyString(candidate.status) ? candidate.status.trim() as CanonFactStatus : 'draft';
    const source = parseFactSource(candidate.source);
    if (confirmedFactMissingSourceState(status, source)) {
      issues.push(issue(
        'MISSING_CANON_FACT_CONFIRMATION',
        `${basePath}.source`,
        'confirmed CanonFact 必须声明来源确认状态：confirmedByUser 或 aiSuggested'
      ));
    }
    if (factNeedsConfirmationWarning(status, source)) {
      issues.push(issue(
        'UNCONFIRMED_AI_CANON_FACT',
        `${basePath}.source`,
        'CanonFact 标记为 confirmed，但来源仍是未确认的 AI 建议；请先让用户确认或降级为 draft/pending'
      ));
    }

    canonFacts.push({
      id: String(candidate.id).trim(),
      summary: String(candidate.summary).trim(),
      type: isNonEmptyString(candidate.type) ? candidate.type.trim() : 'fact',
      evidence,
      affectedEntities: toStringArray(candidate.affectedEntities),
      status,
      source
    });
  });

  return { canonFacts, issues };
};
