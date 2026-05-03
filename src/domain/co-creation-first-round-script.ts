import type {
  FactionPowerStructure,
  InterestingChoice
} from './clarification.js';
import type { StoryCoCreationEntrypointId } from './co-creation-workbench.js';

export type FirstRoundFlowStep =
  | '保存灵感'
  | '推荐入口'
  | '给候选'
  | '用户选择/改写'
  | '创作回声'
  | '下一步推荐';

export type FirstRoundUserResponseKind = 'confirm' | 'rewrite' | 'reject' | 'defer';

export interface FirstRoundCandidate {
  label: string;
  answer: string;
  interestingChoice: InterestingChoice;
  powerStructure?: FactionPowerStructure;
}

export interface FirstRoundEntry {
  id: StoryCoCreationEntrypointId;
  prompt: string;
  candidates: FirstRoundCandidate[];
}

export interface FirstRoundUserResponseExample {
  kind: FirstRoundUserResponseKind;
  text: string;
}

export interface FirstRoundCreationEcho {
  created: string;
  stillOpen: string;
  next: string;
}

export interface FirstRoundScript {
  story: string;
  originalInput: string;
  savedIdea: string;
  flow: FirstRoundFlowStep[];
  recommendedEntries: StoryCoCreationEntrypointId[];
  entries: FirstRoundEntry[];
  userResponseExamples: FirstRoundUserResponseExample[];
  creationEcho: FirstRoundCreationEcho;
  nextRecommendations: string[];
  forbidden: string[];
}

export type FirstRoundScriptIssueCode =
  | 'INVALID_FIRST_ROUND_SCRIPT'
  | 'MISSING_REQUIRED_FLOW_STEP'
  | 'MISSING_REQUIRED_ENTRY'
  | 'MISSING_CANDIDATES'
  | 'INCOMPLETE_INTERESTING_CHOICE'
  | 'INCOMPLETE_FACTION_POWER_STRUCTURE'
  | 'MISSING_USER_RESPONSE_KIND'
  | 'MISSING_CREATION_ECHO'
  | 'FIRST_ROUND_PLAN_TOO_EARLY'
  | 'MISSING_FORBIDDEN_BOUNDARY';

export interface FirstRoundScriptIssue {
  code: FirstRoundScriptIssueCode;
  path: string;
  message: string;
}

export interface FirstRoundScriptValidationResult {
  script?: FirstRoundScript;
  issues: FirstRoundScriptIssue[];
}

const REQUIRED_FLOW: readonly FirstRoundFlowStep[] = [
  '保存灵感',
  '推荐入口',
  '给候选',
  '用户选择/改写',
  '创作回声',
  '下一步推荐'
];

const REQUIRED_ENTRIES: readonly StoryCoCreationEntrypointId[] = [
  'power',
  'stage',
  'faction'
];

const RESPONSE_KINDS: readonly FirstRoundUserResponseKind[] = [
  'confirm',
  'rewrite',
  'reject',
  'defer'
];

const INTERESTING_CHOICE_FIELDS = [
  'appeal',
  'cost',
  'relationshipImpact',
  'worldImpact',
  'futureHook',
  'confirmationBoundary'
] as const;

const POWER_STRUCTURE_STRING_FIELDS = [
  'name',
  'resourceControl',
  'legitimacySource',
  'publicNarrative',
  'firstCollisionScene'
] as const;

const POWER_STRUCTURE_ARRAY_FIELDS = [
  'beneficiaries',
  'victims',
  'internalCracks',
  'relationshipHooks'
] as const;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const stringValue = (value: unknown): string =>
  typeof value === 'string' ? value.trim() : '';

const stringArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter(item => typeof item === 'string' && item.trim()).map(item => item.trim())
    : [];

const issue = (
  code: FirstRoundScriptIssueCode,
  path: string,
  message: string
): FirstRoundScriptIssue => ({ code, path, message });

const normalizeInterestingChoice = (
  value: unknown
): InterestingChoice => {
  const record = isRecord(value) ? value : {};

  return {
    appeal: stringValue(record.appeal),
    cost: stringValue(record.cost),
    relationshipImpact: stringValue(record.relationshipImpact),
    worldImpact: stringValue(record.worldImpact),
    futureHook: stringValue(record.futureHook),
    confirmationBoundary: stringValue(record.confirmationBoundary)
  };
};

const normalizePowerStructure = (
  value: unknown
): FactionPowerStructure | undefined => {
  if (!isRecord(value)) {
    return undefined;
  }

  return {
    name: stringValue(value.name),
    resourceControl: stringValue(value.resourceControl),
    legitimacySource: stringValue(value.legitimacySource),
    beneficiaries: stringArray(value.beneficiaries),
    victims: stringArray(value.victims),
    publicNarrative: stringValue(value.publicNarrative),
    internalCracks: stringArray(value.internalCracks),
    firstCollisionScene: stringValue(value.firstCollisionScene),
    relationshipHooks: stringArray(value.relationshipHooks)
  };
};

const validateInterestingChoice = (
  choice: InterestingChoice,
  path: string,
  issues: FirstRoundScriptIssue[]
): void => {
  for (const field of INTERESTING_CHOICE_FIELDS) {
    if (!choice[field]) {
      issues.push(issue('INCOMPLETE_INTERESTING_CHOICE', `${path}.${field}`, `候选缺少 ${field}`));
    }
  }

  if (choice.confirmationBoundary && !choice.confirmationBoundary.includes('候选')) {
    issues.push(issue('INCOMPLETE_INTERESTING_CHOICE', `${path}.confirmationBoundary`, '确认边界必须说明候选状态'));
  }
};

const validatePowerStructure = (
  powerStructure: FactionPowerStructure | undefined,
  path: string,
  issues: FirstRoundScriptIssue[]
): void => {
  if (!powerStructure) {
    issues.push(issue('INCOMPLETE_FACTION_POWER_STRUCTURE', path, '势力候选缺少 powerStructure'));
    return;
  }

  for (const field of POWER_STRUCTURE_STRING_FIELDS) {
    if (!powerStructure[field]) {
      issues.push(issue('INCOMPLETE_FACTION_POWER_STRUCTURE', `${path}.${field}`, `权力结构缺少 ${field}`));
    }
  }
  for (const field of POWER_STRUCTURE_ARRAY_FIELDS) {
    if (powerStructure[field].length === 0) {
      issues.push(issue('INCOMPLETE_FACTION_POWER_STRUCTURE', `${path}.${field}`, `权力结构缺少 ${field}`));
    }
  }
};

export const validateFirstRoundScript = (
  value: unknown
): FirstRoundScriptValidationResult => {
  const issues: FirstRoundScriptIssue[] = [];

  if (!isRecord(value)) {
    return {
      issues: [issue('INVALID_FIRST_ROUND_SCRIPT', '$', '首轮共创脚本必须是对象')]
    };
  }

  const flow = stringArray(value.flow) as FirstRoundFlowStep[];
  const entries = Array.isArray(value.entries) ? value.entries : [];
  const entryIds = new Set(entries.flatMap(entry =>
    isRecord(entry) ? [stringValue(entry.id)] : []
  ));
  const forbidden = stringArray(value.forbidden);

  for (const step of REQUIRED_FLOW) {
    if (!flow.includes(step)) {
      issues.push(issue('MISSING_REQUIRED_FLOW_STEP', 'flow', `首轮脚本缺少流程步骤：${step}`));
    }
  }

  if (flow.some(step => step.includes('完整计划') || step.includes('写完整计划'))) {
    issues.push(issue('FIRST_ROUND_PLAN_TOO_EARLY', 'flow', '首轮共创不能直接写完整计划'));
  }

  for (const id of REQUIRED_ENTRIES) {
    if (!entryIds.has(id)) {
      issues.push(issue('MISSING_REQUIRED_ENTRY', `entries.${id}`, `首轮脚本缺少 ${id} 入口`));
    }
  }

  const normalizedEntries: FirstRoundEntry[] = entries.flatMap((entry, entryIndex) => {
    if (!isRecord(entry)) {
      issues.push(issue('INVALID_FIRST_ROUND_SCRIPT', `entries[${entryIndex}]`, 'entry 必须是对象'));
      return [];
    }

    const id = stringValue(entry.id) as StoryCoCreationEntrypointId;
    const candidates = Array.isArray(entry.candidates) ? entry.candidates : [];
    if (candidates.length < 2) {
      issues.push(issue('MISSING_CANDIDATES', `entries[${entryIndex}].candidates`, '每个首轮入口至少需要 2 个候选'));
    }

    const normalizedCandidates = candidates.flatMap((candidate, candidateIndex) => {
      if (!isRecord(candidate)) {
        issues.push(issue('INVALID_FIRST_ROUND_SCRIPT', `entries[${entryIndex}].candidates[${candidateIndex}]`, 'candidate 必须是对象'));
        return [];
      }

      const candidatePath = `entries[${entryIndex}].candidates[${candidateIndex}]`;
      const interestingChoice = normalizeInterestingChoice(candidate.interestingChoice);
      const powerStructure = normalizePowerStructure(candidate.powerStructure);
      validateInterestingChoice(interestingChoice, `${candidatePath}.interestingChoice`, issues);
      if (id === 'faction') {
        validatePowerStructure(powerStructure, `${candidatePath}.powerStructure`, issues);
      }

      return [{
        label: stringValue(candidate.label),
        answer: stringValue(candidate.answer),
        interestingChoice,
        powerStructure
      }];
    });

    return [{
      id,
      prompt: stringValue(entry.prompt),
      candidates: normalizedCandidates
    }];
  });

  const responseExamples = Array.isArray(value.userResponseExamples) ? value.userResponseExamples : [];
  const normalizedResponses = responseExamples.flatMap((item, index) => {
    if (!isRecord(item)) {
      issues.push(issue('INVALID_FIRST_ROUND_SCRIPT', `userResponseExamples[${index}]`, '用户回应示例必须是对象'));
      return [];
    }

    return [{
      kind: stringValue(item.kind) as FirstRoundUserResponseKind,
      text: stringValue(item.text)
    }];
  });
  const responseKinds = new Set(normalizedResponses.map(item => item.kind));
  for (const kind of RESPONSE_KINDS) {
    if (!responseKinds.has(kind)) {
      issues.push(issue('MISSING_USER_RESPONSE_KIND', 'userResponseExamples', `缺少 ${kind} 用户回应示例`));
    }
  }

  const creationEchoRecord = isRecord(value.creationEcho) ? value.creationEcho : {};
  const creationEcho = {
    created: stringValue(creationEchoRecord.created),
    stillOpen: stringValue(creationEchoRecord.stillOpen),
    next: stringValue(creationEchoRecord.next)
  };
  if (!creationEcho.created || !creationEcho.stillOpen || !creationEcho.next) {
    issues.push(issue('MISSING_CREATION_ECHO', 'creationEcho', '首轮脚本必须展示创作回声'));
  }

  if (!forbidden.some(item => item.includes('完整 creative-plan.md'))) {
    issues.push(issue('MISSING_FORBIDDEN_BOUNDARY', 'forbidden', '首轮样例必须禁止直接写完整 creative-plan.md'));
  }
  if (!forbidden.some(item => item.includes('未确认角色和势力'))) {
    issues.push(issue('MISSING_FORBIDDEN_BOUNDARY', 'forbidden', '首轮样例必须禁止把未确认角色和势力写入正典'));
  }

  return {
    script: {
      story: stringValue(value.story),
      originalInput: stringValue(value.originalInput),
      savedIdea: stringValue(value.savedIdea),
      flow,
      recommendedEntries: stringArray(value.recommendedEntries) as StoryCoCreationEntrypointId[],
      entries: normalizedEntries,
      userResponseExamples: normalizedResponses,
      creationEcho,
      nextRecommendations: stringArray(value.nextRecommendations),
      forbidden
    },
    issues
  };
};
