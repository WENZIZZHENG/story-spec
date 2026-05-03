import path from 'node:path';
import type { ProjectFileSystem } from './project-ports.js';
import type { ClarificationAnswer, ClarificationQuestion } from '../domain/clarification.js';
import type { ClarificationRecord } from './manage-clarifications.js';
import {
  scanStoryArtifacts,
  type ArtifactScanResult,
  type ScannedStoryProject
} from '../validation/artifact-scanner.js';
import type { ValidationSeverity } from '../validation/schema/index.js';

export type CreativeIntentDriftIssueCode =
  | 'CREATIVE_INTENT_DRIFT_UNCONFIRMED_AI_SUGGESTION'
  | 'CREATIVE_INTENT_DRIFT_PENDING_TOPIC';

export interface CreativeIntentDriftIssue {
  severity: ValidationSeverity;
  code: CreativeIntentDriftIssueCode;
  path: string;
  evidence: string;
  message: string;
  suggestedAction: string;
  story: string;
  questionId: string;
}

export interface DetectCreativeIntentDriftInput {
  projectRoot: string;
  fileSystem: ProjectFileSystem;
  artifactScan?: ArtifactScanResult;
}

export interface CreativeIntentDriftResult {
  issues: CreativeIntentDriftIssue[];
}

interface StoryTextArtifact {
  path: string;
  content: string;
}

const SCANNED_STORY_ARTIFACTS = new Set([
  'specification',
  'creative-plan',
  'tasks',
  'chapter'
]);

const TOPIC_KEYWORDS: Record<string, string[]> = {
  protagonist: ['主角身份', '穿越者身份', '程序员身份', '真实身份'],
  relationship: ['感情对象', '恋人', '伴侣', '爱人', '表白', '亲吻', '暧昧', '女友', '男友', '未婚妻'],
  romance: ['感情对象', '恋人', '伴侣', '爱人', '表白', '亲吻', '暧昧', '女友', '男友', '未婚妻'],
  threat: ['文明级威胁', '灭世', '旧文明', '世界崩塌', '终局危机', '灾厄', '大危机'],
  'civilization-threat': ['文明级威胁', '灭世', '旧文明', '世界崩塌', '终局危机', '灾厄', '大危机'],
  magic: ['法术体系', '魔法等级', '运行时', '编译器', '法术规则', '魔力来源'],
  'magic-system': ['法术体系', '魔法等级', '运行时', '编译器', '法术规则', '魔力来源'],
  building: ['建设流', '纯种田', '种田', '制度改造', '思想改造', '工业化', '城市规划'],
  setting: ['边境小城', '学院', '工坊', '旅队', '王国舞台']
};

const STOP_TERMS = new Set([
  '主角',
  '故事',
  '第一卷',
  '可以',
  '不要',
  '关系',
  '设定',
  '方向',
  '问题',
  '需要',
  '世界',
  '系统'
]);

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const hasAnswerContent = (answer: unknown): boolean => {
  if (typeof answer === 'string') {
    return answer.trim().length > 0;
  }

  if (Array.isArray(answer)) {
    return answer.some(hasAnswerContent);
  }

  return typeof answer === 'number' || typeof answer === 'boolean';
};

const hasConfirmedAnswer = (record: ClarificationRecord, questionId: string): boolean =>
  record.answers.some(answer =>
    answer.questionId === questionId
    && answer.confirmed
    && hasAnswerContent(answer.answer)
  );

const flattenAnswerText = (answer: unknown): string[] => {
  if (typeof answer === 'string') {
    return [answer];
  }

  if (typeof answer === 'number' || typeof answer === 'boolean') {
    return [String(answer)];
  }

  if (Array.isArray(answer)) {
    return answer.flatMap(flattenAnswerText);
  }

  return [];
};

const normalizeTerm = (term: string): string => term.trim();

const extractAnswerTerms = (answer: unknown): string[] => {
  const terms = new Set<string>();

  for (const text of flattenAnswerText(answer)) {
    const normalizedText = normalizeTerm(text);
    if (normalizedText.length >= 2 && normalizedText.length <= 24 && !STOP_TERMS.has(normalizedText)) {
      terms.add(normalizedText);
    }

    for (const part of normalizedText.split(/[\s,，。；;、：:（）()【】[\]"“”'<>《》/\\]+/)) {
      const term = normalizeTerm(part);
      if (term.length >= 2 && term.length <= 24 && !STOP_TERMS.has(term)) {
        terms.add(term);
      }
    }
  }

  return [...terms];
};

const questionKeywords = (question: ClarificationQuestion): string[] => {
  const topicKeywords = TOPIC_KEYWORDS[question.topic] ?? [];
  const idKeywords = Object.entries(TOPIC_KEYWORDS)
    .filter(([key]) => question.id.includes(key))
    .flatMap(([, values]) => values);

  return [...new Set([...topicKeywords, ...idKeywords])];
};

const readClarificationRecord = async (
  fs: ProjectFileSystem,
  storyPath: string
): Promise<ClarificationRecord | undefined> => {
  const recordPath = path.join(storyPath, 'clarifications.json');
  if (!await fs.pathExists(recordPath)) {
    return undefined;
  }

  try {
    return await fs.readJson<ClarificationRecord>(recordPath);
  } catch {
    return undefined;
  }
};

const listFilesRecursive = async (
  fs: ProjectFileSystem,
  dirPath: string
): Promise<string[]> => {
  if (!await fs.pathExists(dirPath)) {
    return [];
  }

  const files: string[] = [];
  for (const entry of await fs.readDir(dirPath)) {
    const entryPath = path.join(dirPath, entry);
    const stat = await fs.stat(entryPath);
    if (stat.isDirectory()) {
      files.push(...await listFilesRecursive(fs, entryPath));
    } else if (stat.isFile()) {
      files.push(entryPath);
    }
  }

  return files.sort();
};

const collectStoryTextArtifacts = async (
  fs: ProjectFileSystem,
  story: ScannedStoryProject
): Promise<StoryTextArtifact[]> => {
  const knownPaths = story.artifacts
    .filter(artifact => artifact.exists && SCANNED_STORY_ARTIFACTS.has(artifact.kind))
    .map(artifact => artifact.path);
  const scenePaths = (await listFilesRecursive(fs, path.join(story.path, 'scenes')))
    .filter(filePath => filePath.endsWith('.yaml') || filePath.endsWith('.yml') || filePath.endsWith('.md'));
  const paths = [...new Set([...knownPaths, ...scenePaths])];
  const artifacts: StoryTextArtifact[] = [];

  for (const filePath of paths) {
    try {
      artifacts.push({
        path: filePath,
        content: await fs.readFile(filePath)
      });
    } catch {
      continue;
    }
  }

  return artifacts;
};

const createUnconfirmedSuggestionIssue = (
  story: ScannedStoryProject,
  artifact: StoryTextArtifact,
  answer: ClarificationAnswer,
  term: string
): CreativeIntentDriftIssue => ({
  severity: 'warning',
  code: 'CREATIVE_INTENT_DRIFT_UNCONFIRMED_AI_SUGGESTION',
  path: artifact.path,
  evidence: `命中未确认 AI 建议：${term}`,
  message: `故事 ${story.name} 将未确认 AI 建议 ${answer.questionId} 写入了创作产物。`,
  suggestedAction: `先回到 clarifications.json 确认 ${answer.questionId}，或把“${term}”从该产物移回待确认任务；不要自动重写正文。`,
  story: story.name,
  questionId: answer.questionId
});

const createPendingTopicIssue = (
  story: ScannedStoryProject,
  artifact: StoryTextArtifact,
  question: ClarificationQuestion,
  terms: string[]
): CreativeIntentDriftIssue => ({
  severity: 'warning',
  code: 'CREATIVE_INTENT_DRIFT_PENDING_TOPIC',
  path: artifact.path,
  evidence: `命中待确认主题词：${terms.join('、')}`,
  message: `故事 ${story.name} 的待确认问题 ${question.id} 已被相关内容触及：${question.question}`,
  suggestedAction: `先让用户回答 ${question.id}，再决定这些内容能否进入 specification、tasks 或正文；把处理动作写成任务草稿。`,
  story: story.name,
  questionId: question.id
});

const detectUnconfirmedSuggestionUse = (
  story: ScannedStoryProject,
  record: ClarificationRecord,
  artifacts: StoryTextArtifact[]
): CreativeIntentDriftIssue[] => {
  const issues: CreativeIntentDriftIssue[] = [];

  for (const answer of record.answers) {
    if (answer.source !== 'ai-suggested' || answer.confirmed || !hasAnswerContent(answer.answer)) {
      continue;
    }

    const terms = extractAnswerTerms(answer.answer);
    for (const artifact of artifacts) {
      const matchedTerm = terms.find(term => artifact.content.includes(term));
      if (matchedTerm) {
        issues.push(createUnconfirmedSuggestionIssue(story, artifact, answer, matchedTerm));
      }
    }
  }

  return issues;
};

const detectPendingTopicUse = (
  story: ScannedStoryProject,
  record: ClarificationRecord,
  artifacts: StoryTextArtifact[]
): CreativeIntentDriftIssue[] => {
  const issues: CreativeIntentDriftIssue[] = [];

  for (const question of record.questions) {
    if (!question.required || hasConfirmedAnswer(record, question.id)) {
      continue;
    }

    const terms = questionKeywords(question);
    if (terms.length === 0) {
      continue;
    }

    for (const artifact of artifacts) {
      const matchedTerms = terms.filter(term => artifact.content.includes(term)).slice(0, 3);
      if (matchedTerms.length > 0) {
        issues.push(createPendingTopicIssue(story, artifact, question, matchedTerms));
      }
    }
  }

  return issues;
};

const dedupeIssues = (issues: CreativeIntentDriftIssue[]): CreativeIntentDriftIssue[] => {
  const seen = new Set<string>();
  const deduped: CreativeIntentDriftIssue[] = [];

  for (const issue of issues) {
    const key = `${issue.code}:${issue.path}:${issue.questionId}:${issue.evidence}`;
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    deduped.push(issue);
  }

  return deduped.sort((left, right) =>
    left.path.localeCompare(right.path)
    || left.code.localeCompare(right.code)
    || left.questionId.localeCompare(right.questionId)
  );
};

export const detectCreativeIntentDrift = async (
  input: DetectCreativeIntentDriftInput
): Promise<CreativeIntentDriftResult> => {
  const artifactScan = input.artifactScan
    ?? await scanStoryArtifacts({ projectRoot: input.projectRoot, fileSystem: input.fileSystem });
  const issueGroups = await Promise.all(artifactScan.stories.map(async story => {
    const record = await readClarificationRecord(input.fileSystem, story.path);
    if (!record) {
      return [];
    }

    const artifacts = await collectStoryTextArtifacts(input.fileSystem, story);
    return [
      ...detectUnconfirmedSuggestionUse(story, record, artifacts),
      ...detectPendingTopicUse(story, record, artifacts)
    ];
  }));

  return {
    issues: dedupeIssues(issueGroups.flat())
  };
};
