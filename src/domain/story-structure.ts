import yaml from 'js-yaml';

export type StoryEntityStatus = 'active' | 'inactive' | 'dead' | 'unknown' | 'retired';
export type StoryEdgeConfidence = 'explicit' | 'inferred' | 'draft';

export interface StoryEntity {
  id: string;
  type: string;
  name: string;
  aliases: string[];
  status: StoryEntityStatus;
  sourcePaths: string[];
  tags: string[];
}

export interface StoryEdge {
  id: string;
  from: string;
  to: string;
  relation: string;
  evidencePaths: string[];
  confidence: StoryEdgeConfidence;
}

export interface StoryGraph {
  entities: StoryEntity[];
  edges: StoryEdge[];
}

export interface SceneCard {
  id: string;
  chapter: string;
  order: number;
  pov: string;
  location: string;
  time: string;
  sceneGoal: string;
  conflict: string;
  outcome: string;
  emotionalTurn: string;
  entities: string[];
  worldElements: string[];
  canonFacts: string[];
  reveals: string[];
  foreshadowing: {
    planted: string[];
    paidOff: string[];
  };
  requiredReads: string[];
  allowedWrites: string[];
  draftPath?: string;
}

export interface StoryStructureIssue {
  severity: 'error' | 'warning' | 'info';
  code:
    | 'INVALID_GRAPH_DOCUMENT'
    | 'INVALID_STORY_ENTITY'
    | 'MISSING_STORY_ENTITY_FIELD'
    | 'INVALID_STORY_EDGE'
    | 'MISSING_STORY_EDGE_FIELD'
    | 'UNKNOWN_STORY_EDGE_ENTITY'
    | 'INVALID_SCENE_DOCUMENT'
    | 'INVALID_SCENE_CARD'
    | 'MISSING_SCENE_FIELD'
    | 'DUPLICATE_SCENE_ORDER'
    | 'UNKNOWN_SCENE_ENTITY';
  path: string;
  message: string;
}

export interface ParsedStoryEntitiesDocument {
  entities: StoryEntity[];
  issues: StoryStructureIssue[];
}

export interface ParsedStoryEdgesDocument {
  edges: StoryEdge[];
  issues: StoryStructureIssue[];
}

export interface ParsedSceneCardDocument {
  scenes: SceneCard[];
  issues: StoryStructureIssue[];
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const toStringArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter(isNonEmptyString).map(item => item.trim())
    : [];

const readArray = (
  document: unknown,
  key: string
): unknown[] => isRecord(document) && Array.isArray(document[key])
  ? document[key] as unknown[]
  : [];

const issue = (
  code: StoryStructureIssue['code'],
  path: string,
  message: string,
  severity: StoryStructureIssue['severity'] = 'warning'
): StoryStructureIssue => ({
  code,
  path,
  message,
  severity
});

const parseJsonDocument = (
  content: string,
  filePath: string,
  code: StoryStructureIssue['code']
): { document?: unknown; issues: StoryStructureIssue[] } => {
  try {
    return { document: JSON.parse(content), issues: [] };
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    return {
      issues: [issue(code, filePath, `JSON 无法解析：${detail}`, 'error')]
    };
  }
};

export const parseStoryEntitiesDocument = (
  content: string,
  filePath: string
): ParsedStoryEntitiesDocument => {
  const parsed = parseJsonDocument(content, filePath, 'INVALID_GRAPH_DOCUMENT');
  if (!parsed.document) {
    return { entities: [], issues: parsed.issues };
  }

  if (!isRecord(parsed.document)) {
    return {
      entities: [],
      issues: [issue('INVALID_GRAPH_DOCUMENT', filePath, 'entities 文档顶层必须是对象')]
    };
  }

  const issues: StoryStructureIssue[] = [];
  const entities: StoryEntity[] = [];
  readArray(parsed.document, 'entities').forEach((candidate, index) => {
    const basePath = `${filePath}#entities[${index}]`;
    if (!isRecord(candidate)) {
      issues.push(issue('INVALID_STORY_ENTITY', basePath, 'StoryEntity 必须是对象'));
      return;
    }

    const missingFields = [
      ['id', candidate.id],
      ['type', candidate.type],
      ['name', candidate.name]
    ].filter(([, value]) => !isNonEmptyString(value));

    for (const [field] of missingFields) {
      issues.push(issue('MISSING_STORY_ENTITY_FIELD', `${basePath}.${field}`, `StoryEntity 缺少 ${field}`));
    }

    if (missingFields.length > 0) {
      return;
    }

    entities.push({
      id: String(candidate.id).trim(),
      type: String(candidate.type).trim(),
      name: String(candidate.name).trim(),
      aliases: toStringArray(candidate.aliases),
      status: isNonEmptyString(candidate.status) ? candidate.status.trim() as StoryEntityStatus : 'active',
      sourcePaths: toStringArray(candidate.sourcePaths),
      tags: toStringArray(candidate.tags)
    });
  });

  return { entities, issues };
};

export const parseStoryEdgesDocument = (
  content: string,
  filePath: string
): ParsedStoryEdgesDocument => {
  const parsed = parseJsonDocument(content, filePath, 'INVALID_GRAPH_DOCUMENT');
  if (!parsed.document) {
    return { edges: [], issues: parsed.issues };
  }

  if (!isRecord(parsed.document)) {
    return {
      edges: [],
      issues: [issue('INVALID_GRAPH_DOCUMENT', filePath, 'edges 文档顶层必须是对象')]
    };
  }

  const issues: StoryStructureIssue[] = [];
  const edges: StoryEdge[] = [];
  readArray(parsed.document, 'edges').forEach((candidate, index) => {
    const basePath = `${filePath}#edges[${index}]`;
    if (!isRecord(candidate)) {
      issues.push(issue('INVALID_STORY_EDGE', basePath, 'StoryEdge 必须是对象'));
      return;
    }

    const missingFields = [
      ['id', candidate.id],
      ['from', candidate.from],
      ['to', candidate.to],
      ['relation', candidate.relation]
    ].filter(([, value]) => !isNonEmptyString(value));

    for (const [field] of missingFields) {
      issues.push(issue('MISSING_STORY_EDGE_FIELD', `${basePath}.${field}`, `StoryEdge 缺少 ${field}`));
    }

    const evidencePaths = toStringArray(candidate.evidencePaths);
    if (evidencePaths.length === 0) {
      issues.push(issue('MISSING_STORY_EDGE_FIELD', `${basePath}.evidencePaths`, 'StoryEdge 必须声明 evidencePaths'));
    }

    if (missingFields.length > 0 || evidencePaths.length === 0) {
      return;
    }

    edges.push({
      id: String(candidate.id).trim(),
      from: String(candidate.from).trim(),
      to: String(candidate.to).trim(),
      relation: String(candidate.relation).trim(),
      evidencePaths,
      confidence: isNonEmptyString(candidate.confidence) ? candidate.confidence.trim() as StoryEdgeConfidence : 'explicit'
    });
  });

  return { edges, issues };
};

const parseSceneDocument = (
  content: string,
  filePath: string
): unknown => {
  if (filePath.endsWith('.json')) {
    return JSON.parse(content);
  }

  return yaml.load(content);
};

const toNumber = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (isNonEmptyString(value)) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
};

const readForeshadowing = (value: unknown): SceneCard['foreshadowing'] => {
  if (!isRecord(value)) {
    return { planted: [], paidOff: [] };
  }

  return {
    planted: toStringArray(value.planted),
    paidOff: toStringArray(value.paidOff)
  };
};

export const parseSceneCardDocument = (
  content: string,
  filePath: string
): ParsedSceneCardDocument => {
  let document: unknown;
  try {
    document = parseSceneDocument(content, filePath);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    return {
      scenes: [],
      issues: [issue('INVALID_SCENE_DOCUMENT', filePath, `scene 文档无法解析：${detail}`, 'error')]
    };
  }

  if (!isRecord(document)) {
    return {
      scenes: [],
      issues: [issue('INVALID_SCENE_DOCUMENT', filePath, 'scene 文档顶层必须是对象')]
    };
  }

  const candidateScenes = Array.isArray(document.scenes) ? document.scenes : [document];
  const issues: StoryStructureIssue[] = [];
  const scenes: SceneCard[] = [];

  candidateScenes.forEach((candidate, index) => {
    const basePath = Array.isArray(document.scenes)
      ? `${filePath}#scenes[${index}]`
      : filePath;
    if (!isRecord(candidate)) {
      issues.push(issue('INVALID_SCENE_CARD', basePath, 'SceneCard 必须是对象'));
      return;
    }

    const missingFields = [
      ['id', candidate.id],
      ['chapter', candidate.chapter],
      ['pov', candidate.pov],
      ['location', candidate.location],
      ['time', candidate.time],
      ['sceneGoal', candidate.sceneGoal],
      ['conflict', candidate.conflict],
      ['outcome', candidate.outcome]
    ].filter(([, value]) => !isNonEmptyString(value));
    const order = toNumber(candidate.order);

    for (const [field] of missingFields) {
      issues.push(issue('MISSING_SCENE_FIELD', `${basePath}.${field}`, `SceneCard 缺少 ${field}`));
    }

    if (order === undefined) {
      issues.push(issue('MISSING_SCENE_FIELD', `${basePath}.order`, 'SceneCard 缺少 order'));
    }

    if (missingFields.length > 0 || order === undefined) {
      return;
    }

    scenes.push({
      id: String(candidate.id).trim(),
      chapter: String(candidate.chapter).trim(),
      order,
      pov: String(candidate.pov).trim(),
      location: String(candidate.location).trim(),
      time: String(candidate.time).trim(),
      sceneGoal: String(candidate.sceneGoal).trim(),
      conflict: String(candidate.conflict).trim(),
      outcome: String(candidate.outcome).trim(),
      emotionalTurn: isNonEmptyString(candidate.emotionalTurn) ? candidate.emotionalTurn.trim() : '',
      entities: toStringArray(candidate.entities),
      worldElements: toStringArray(candidate.worldElements),
      canonFacts: toStringArray(candidate.canonFacts),
      reveals: toStringArray(candidate.reveals),
      foreshadowing: readForeshadowing(candidate.foreshadowing),
      requiredReads: toStringArray(candidate.requiredReads),
      allowedWrites: toStringArray(candidate.allowedWrites),
      draftPath: isNonEmptyString(candidate.draftPath) ? candidate.draftPath.trim() : undefined
    });
  });

  return { scenes, issues };
};

export const validateStoryGraph = (
  graph: StoryGraph,
  sourcePath: string
): StoryStructureIssue[] => {
  const entityIds = new Set(graph.entities.map(entity => entity.id));
  const issues: StoryStructureIssue[] = [];

  graph.edges.forEach(edge => {
    if (!entityIds.has(edge.from)) {
      issues.push(issue('UNKNOWN_STORY_EDGE_ENTITY', `${sourcePath}#${edge.id}.from`, `edge 引用不存在的 from entity：${edge.from}`, 'error'));
    }

    if (!entityIds.has(edge.to)) {
      issues.push(issue('UNKNOWN_STORY_EDGE_ENTITY', `${sourcePath}#${edge.id}.to`, `edge 引用不存在的 to entity：${edge.to}`, 'error'));
    }
  });

  return issues;
};
